import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { DatasetLoaderService, type DatasetLoadedResult } from '../services/datasetLoader';
import type { LoadingProgress, LoadingPhase, DashboardFilters } from '../types/dataset';
import { DEFAULT_FILTERS } from '../types/dataset';
import type { CleanEncounterRecord } from '../types/dataset';
import { applyFilters } from '../services/statistics';

interface DataContextState {
  data: DatasetLoadedResult | null;
  progress: LoadingProgress;
  error: string | null;
  isLoading: boolean;
  isReady: boolean;
  reload: () => void;
  loadFromFiles: (dataFile: File, idsFile: File) => void;

  // Dashboard filtering
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  filteredRecords: CleanEncounterRecord[];
  isFiltered: boolean;
}

const defaultProgress: LoadingProgress = {
  phase: 'idle',
  message: 'Initializing...',
  percentage: 0,
  loadedBytes: 0,
  totalBytes: 0,
  parsedRows: 0,
  totalExpectedRows: 101766
};

const DataContext = createContext<DataContextState>({
  data: null,
  progress: defaultProgress,
  error: null,
  isLoading: false,
  isReady: false,
  reload: () => {},
  loadFromFiles: () => {},
  filters: DEFAULT_FILTERS,
  setFilter: () => {},
  resetFilters: () => {},
  filteredRecords: [],
  isFiltered: false
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DatasetLoadedResult | null>(null);
  const [progress, setProgress] = useState<LoadingProgress>(defaultProgress);
  const [error, setError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const isLoading: boolean = (
    progress.phase !== 'idle' &&
    progress.phase !== 'ready' &&
    progress.phase !== 'error'
  );
  const isReady = progress.phase === 'ready' && data !== null;

  const runLoad = useCallback(
    (loader: (cb: (p: LoadingProgress) => void) => Promise<DatasetLoadedResult>) => {
      setData(null);
      setError(null);
      setFilters(DEFAULT_FILTERS);
      setProgress({
        phase: 'fetching_ids',
        message: 'Starting dataset load pipeline...',
        percentage: 5,
        loadedBytes: 0,
        totalBytes: 0,
        parsedRows: 0,
        totalExpectedRows: 101766
      });
      loader((p) => setProgress(p))
        .then((result) => { setData(result); })
        .catch((err: Error) => { setError(err.message ?? 'Unknown error'); });
    },
    []
  );

  useEffect(() => {
    runLoad((cb) => DatasetLoaderService.loadDataset(cb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  const reload = useCallback(() => setLoadKey((k) => k + 1), []);

  const loadFromFiles = useCallback(
    (dataFile: File, idsFile: File) => {
      runLoad((cb) => DatasetLoaderService.loadFromFiles(dataFile, idsFile, cb));
    },
    [runLoad]
  );

  const setFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // Derive filteredRecords reactively from data + filters
  const filteredRecords = useMemo<CleanEncounterRecord[]>(() => {
    if (!data) return [];
    return applyFilters(data.cleanRecords, filters);
  }, [data, filters]);

  const isFiltered = useMemo(() => {
    const f = filters;
    return (
      f.age !== 'ALL' ||
      f.gender !== 'ALL' ||
      f.admissionType !== 'ALL' ||
      f.admissionSource !== 'ALL' ||
      f.dischargeDisposition !== 'ALL' ||
      f.losRange !== 'ALL' ||
      f.readmission !== 'ALL' ||
      f.search !== ''
    );
  }, [filters]);

  return (
    <DataContext.Provider value={{
      data, progress, error, isLoading, isReady, reload, loadFromFiles,
      filters, setFilter, resetFilters, filteredRecords, isFiltered
    }}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDataContext(): DataContextState {
  return useContext(DataContext);
}

export type { LoadingPhase };
