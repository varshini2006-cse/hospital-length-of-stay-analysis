import { useCallback } from 'react';
import { Filter, X, Download, RotateCcw, AlertCircle } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import { exportEncountersToCSV } from '../services/exportService';

const AGE_GROUPS = [
  '[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)',
  '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'
];

const LOS_RANGES = [
  { value: '1-3', label: '1–3 days' },
  { value: '4-7', label: '4–7 days' },
  { value: '8-14', label: '8–14 days' }
];

const READMISSION_OPTIONS = [
  { value: 'NO', label: 'No Readmission' },
  { value: '>30', label: 'Readmit > 30 days' },
  { value: '<30', label: 'Readmit < 30 days' }
];

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <label htmlFor={id} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden cursor-pointer shadow-2xs hover:border-slate-300 transition-colors"
      >
        <option value="ALL">All {label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface DashboardFilterBarProps {
  showExport?: boolean;
  exportFilename?: string;
}

export default function DashboardFilterBar({ showExport = true, exportFilename }: DashboardFilterBarProps) {
  const { data, filters, setFilter, resetFilters, filteredRecords, isFiltered, isReady } = useDataContext();

  const totalRecords = data?.cleanRecords.length ?? 0;
  const filteredCount = filteredRecords.length;
  const pct = totalRecords > 0 ? ((filteredCount / totalRecords) * 100).toFixed(1) : '0.0';

  // Dynamic filter options derived from data
  const admissionTypes = useCallback(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.cleanRecords.forEach((r) => { if (r.admission_type_desc) s.add(r.admission_type_desc); });
    return Array.from(s).sort().map((v) => ({ value: v, label: v }));
  }, [data])();

  const admissionSources = useCallback(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.cleanRecords.forEach((r) => { if (r.admission_source_desc) s.add(r.admission_source_desc); });
    return Array.from(s).sort().map((v) => ({ value: v, label: v }));
  }, [data])();

  const dischargeDispositions = useCallback(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.cleanRecords.forEach((r) => { if (r.discharge_disposition_desc) s.add(r.discharge_disposition_desc); });
    return Array.from(s).sort().map((v) => ({ value: v, label: v }));
  }, [data])();

  const handleExport = useCallback(() => {
    if (filteredRecords.length === 0) return;
    const filename = exportFilename ?? `encounters_filtered_n${filteredRecords.length}.csv`;
    exportEncountersToCSV(filteredRecords, filename);
  }, [filteredRecords, exportFilename]);

  if (!isReady) return null;

  return (
    <div className="research-card p-4 sm:p-5 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-800">Inpatient Cohort Filters</span>
          {isFiltered && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              Filter Active
            </span>
          )}
        </div>

        {/* Counter badge & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
              isFiltered
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            role="status"
          >
            <span className="font-bold">{filteredCount.toLocaleString()}</span>
            {' '}/{' '}
            {totalRecords.toLocaleString()} encounters
            {' '}
            <span className="opacity-75">({pct}%)</span>
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              aria-label="Reset all filters"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer bg-white shadow-2xs focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-hidden"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          )}

          {showExport && (
            <button
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
              title="Export filtered encounters as CSV"
              aria-label="Export filtered encounters as CSV"
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter grid: fully responsive across mobile, tablet, laptop, desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Age */}
        <SelectFilter
          id="filter-age"
          label="Age Cohort"
          value={filters.age}
          onChange={(v) => setFilter('age', v)}
          options={AGE_GROUPS.map((a) => ({ value: a, label: a }))}
        />

        {/* Gender */}
        <SelectFilter
          id="filter-gender"
          label="Gender"
          value={filters.gender}
          onChange={(v) => setFilter('gender', v)}
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' }
          ]}
        />

        {/* LOS Range */}
        <SelectFilter
          id="filter-los"
          label="LOS Range"
          value={filters.losRange}
          onChange={(v) => setFilter('losRange', v)}
          options={LOS_RANGES}
        />

        {/* Readmission */}
        <SelectFilter
          id="filter-readmit"
          label="Readmission"
          value={filters.readmission}
          onChange={(v) => setFilter('readmission', v)}
          options={READMISSION_OPTIONS}
        />

        {/* Admission Type */}
        <SelectFilter
          id="filter-adm-type"
          label="Admission Type"
          value={filters.admissionType}
          onChange={(v) => setFilter('admissionType', v)}
          options={admissionTypes}
        />

        {/* Admission Source */}
        <SelectFilter
          id="filter-adm-source"
          label="Admission Source"
          value={filters.admissionSource}
          onChange={(v) => setFilter('admissionSource', v)}
          options={admissionSources}
        />

        {/* Discharge Disposition */}
        <SelectFilter
          id="filter-discharge"
          label="Discharge"
          value={filters.dischargeDisposition}
          onChange={(v) => setFilter('dischargeDisposition', v)}
          options={dischargeDispositions}
        />
      </div>

      {/* Text search */}
      <div className="relative">
        <label htmlFor="filter-search" className="sr-only">Search encounters by keyword</label>
        <input
          id="filter-search"
          type="search"
          placeholder="Search by encounter ID, patient token, diagnosis category, specialty, or race..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="w-full pl-3.5 pr-10 py-2 text-xs border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden text-slate-800 shadow-2xs"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-md"
            title="Clear search input"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Empty result warning */}
      {isFiltered && filteredCount === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-lg" role="alert">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>No encounters match the current filter combination. Adjust or reset filters to restore results.</span>
        </div>
      )}
    </div>
  );
}
