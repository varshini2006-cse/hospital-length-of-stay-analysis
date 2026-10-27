import { useMemo, useState, useEffect } from 'react';
import { useDataContext } from '../context/DataContext';
import { 
  Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  X, Eye, Activity, Filter, Download
} from 'lucide-react';
import type { CleanEncounterRecord } from '../types/dataset';
import { exportEncountersToCSV } from '../services/exportService';

const PAGE_SIZE = 25;

type SortKey = 'encounter_id' | 'time_in_hospital' | 'num_lab_procedures' | 'num_procedures' | 'num_medications' | 'number_diagnoses';
type SortOrder = 'asc' | 'desc';

export default function DatasetExplorerPage() {
  const { data, isReady } = useDataContext();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  
  // Structured Filters
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [admTypeFilter, setAdmTypeFilter] = useState('ALL');
  const [readmitFilter, setReadmitFilter] = useState('ALL');
  const [losFilter, setLosFilter] = useState('ALL'); // ALL, 1-3, 4-7, 8-14
  
  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('encounter_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Record Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<CleanEncounterRecord | null>(null);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedRecord) {
        setSelectedRecord(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

  // Filter options
  const admissionTypes = useMemo(() => {
    if (!data) return [];
    const types = new Set<string>();
    for (const r of data.cleanRecords) {
      if (r.admission_type_desc) types.add(r.admission_type_desc);
    }
    return Array.from(types).sort();
  }, [data]);

  const ageGroups = ['[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'];

  // Filter and sort execution
  const filteredAndSorted = useMemo(() => {
    if (!data) return [];
    let rows = data.cleanRecords;

    // Text search (encounter ID, diagnosis category, patient number, specialty)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) =>
        r.encounter_id.includes(q) ||
        r.diag_1_category.toLowerCase().includes(q) ||
        (r.race ?? '').toLowerCase().includes(q) ||
        (r.medical_specialty ?? '').toLowerCase().includes(q) ||
        r.patient_nbr.includes(q)
      );
    }

    // Filter: Age
    if (ageFilter !== 'ALL') {
      rows = rows.filter((r) => r.age === ageFilter);
    }

    // Filter: Admission Type
    if (admTypeFilter !== 'ALL') {
      rows = rows.filter((r) => r.admission_type_desc === admTypeFilter);
    }

    // Filter: Readmission
    if (readmitFilter !== 'ALL') {
      rows = rows.filter((r) => r.readmitted === readmitFilter);
    }

    // Filter: LOS Range
    if (losFilter === '1-3') {
      rows = rows.filter((r) => r.time_in_hospital >= 1 && r.time_in_hospital <= 3);
    } else if (losFilter === '4-7') {
      rows = rows.filter((r) => r.time_in_hospital >= 4 && r.time_in_hospital <= 7);
    } else if (losFilter === '8-14') {
      rows = rows.filter((r) => r.time_in_hospital >= 8 && r.time_in_hospital <= 14);
    }

    // Sorting
    return [...rows].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortKey === 'encounter_id') {
        valA = parseInt(a.encounter_id, 10);
        valB = parseInt(b.encounter_id, 10);
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, search, ageFilter, admTypeFilter, readmitFilter, losFilter, sortKey, sortOrder]);

  const totalCount = filteredAndSorted.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageRows = filteredAndSorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setPage(0);
  }

  function resetFilters() {
    setSearch('');
    setAgeFilter('ALL');
    setAdmTypeFilter('ALL');
    setReadmitFilter('ALL');
    setLosFilter('ALL');
    setPage(0);
  }

  function handleExport() {
    if (filteredAndSorted.length === 0) return;
    exportEncountersToCSV(filteredAndSorted, `filtered_explorer_n${filteredAndSorted.length}.csv`);
  }

  if (!isReady || !data) {
    return (
      <div className="research-card p-12 text-center text-slate-500 text-sm" role="status">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-3" />
        Loading clinical encounters for Explorer...
      </div>
    );
  }

  const isFiltered = search || ageFilter !== 'ALL' || admTypeFilter !== 'ALL' || readmitFilter !== 'ALL' || losFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" aria-hidden="true" />
            Empirical Cohort Database
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Clinical Dataset Explorer
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Search, sort, filter, and inspect all 101,766 verified hospital encounter records. Identifiers are de-identified for academic privacy.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExport}
            disabled={filteredAndSorted.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
            aria-label="Export filtered encounters to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-mono shadow-2xs">
            Showing <span className="font-bold text-slate-900">{totalCount.toLocaleString()}</span> of 101,766
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="research-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-1">
            <label htmlFor="explorer-search" className="sr-only">Search records</label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="explorer-search"
              type="text"
              placeholder="Search ID, diagnosis, race..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:bg-white text-slate-800 focus:outline-hidden"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Age filter */}
          <div>
            <label htmlFor="explorer-age-filter" className="sr-only">Filter by Age</label>
            <select
              id="explorer-age-filter"
              value={ageFilter}
              onChange={(e) => { setAgeFilter(e.target.value); setPage(0); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Age Cohorts</option>
              {ageGroups.map((ag) => (
                <option key={ag} value={ag}>{ag} years</option>
              ))}
            </select>
          </div>

          {/* Admission Type filter */}
          <div>
            <label htmlFor="explorer-adm-filter" className="sr-only">Filter by Admission Type</label>
            <select
              id="explorer-adm-filter"
              value={admTypeFilter}
              onChange={(e) => { setAdmTypeFilter(e.target.value); setPage(0); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Admission Types</option>
              {admissionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* LOS Range filter */}
          <div>
            <label htmlFor="explorer-los-filter" className="sr-only">Filter by Length of Stay</label>
            <select
              id="explorer-los-filter"
              value={losFilter}
              onChange={(e) => { setLosFilter(e.target.value); setPage(0); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All LOS Durations</option>
              <option value="1-3">Short Stay (1–3 days)</option>
              <option value="4-7">Medium Stay (4–7 days)</option>
              <option value="8-14">Extended Stay (8–14 days)</option>
            </select>
          </div>

          {/* Readmission filter */}
          <div>
            <label htmlFor="explorer-readmit-filter" className="sr-only">Filter by Readmission</label>
            <select
              id="explorer-readmit-filter"
              value={readmitFilter}
              onChange={(e) => { setReadmitFilter(e.target.value); setPage(0); }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Readmission Statuses</option>
              <option value="NO">No Readmission (NO)</option>
              <option value=">30">Readmitted &gt;30 Days</option>
              <option value="<30">Readmitted &lt;30 Days (High Risk)</option>
            </select>
          </div>
        </div>

        {/* Filter reset button if active */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-mono">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
              Active subset: {totalCount.toLocaleString()} matching encounters
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1"
            >
              <X className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Encounter Data Table */}
      <div className="research-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Table of de-identified patient encounters</caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider sticky top-0 z-10">
                <th scope="col" className="py-3 px-3">
                  <button
                    onClick={() => handleSort('encounter_id')}
                    className="flex items-center gap-1 hover:text-slate-900 cursor-pointer font-semibold"
                    aria-label="Sort by Encounter Token"
                  >
                    Token
                    {sortKey === 'encounter_id' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3">Age</th>
                <th scope="col" className="py-3 px-3">Gender</th>
                <th scope="col" className="py-3 px-3">Race</th>
                <th scope="col" className="py-3 px-3">Admission Type (IDS)</th>
                <th scope="col" className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleSort('time_in_hospital')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer text-blue-700 font-bold"
                    aria-label="Sort by Length of Stay"
                  >
                    LOS
                    {sortKey === 'time_in_hospital' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blue-600" />
                    )}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleSort('num_lab_procedures')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer font-semibold ml-auto"
                    aria-label="Sort by Lab count"
                  >
                    Labs
                    {sortKey === 'num_lab_procedures' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleSort('num_procedures')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer font-semibold ml-auto"
                    aria-label="Sort by Procedure count"
                  >
                    Proc
                    {sortKey === 'num_procedures' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleSort('num_medications')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer font-semibold ml-auto"
                    aria-label="Sort by Medication count"
                  >
                    Meds
                    {sortKey === 'num_medications' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleSort('number_diagnoses')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer font-semibold ml-auto"
                    aria-label="Sort by Diagnosis count"
                  >
                    Diags
                    {sortKey === 'number_diagnoses' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th scope="col" className="py-3 px-3 text-center">Readmit</th>
                <th scope="col" className="py-3 px-3 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((r, i) => (
                <tr
                  key={r.encounter_id}
                  onClick={() => setSelectedRecord(r)}
                  className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRecord(r);
                    }
                  }}
                  role="button"
                  aria-label={`Inspect encounter ${r.encounter_id}, stay ${r.time_in_hospital} days`}
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                    ENC-{r.encounter_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{r.age}</td>
                  <td className="py-2.5 px-3 text-slate-600">{r.gender}</td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {r.race || <span className="text-slate-400 italic">Not Reported</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-[150px] truncate" title={r.admission_type_desc}>
                    {r.admission_type_desc}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                      {r.time_in_hospital} d
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-right">{r.num_lab_procedures}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-right">{r.num_procedures}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-right">{r.num_medications}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-right">{r.number_diagnoses}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      r.readmitted === 'NO'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.readmitted === '>30'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.readmitted}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden"
                      title="View Clinical Profile"
                      aria-label={`View details for encounter ${r.encounter_id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{totalCount === 0 ? 0 : page * PAGE_SIZE + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(totalCount, (page + 1) * PAGE_SIZE)}</span> of{' '}
            <span className="font-semibold">{totalCount.toLocaleString()}</span> encounters
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="px-3 py-1.5 font-mono text-slate-700 bg-white border border-slate-200 rounded-lg">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden"
              aria-label="Next page"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Record-Detail Panel / Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedRecord(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-encounter-title"
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Clinical Encounter Record
                  </span>
                  <span className="text-xs font-mono text-slate-500">ENC-{selectedRecord.encounter_id}</span>
                </div>
                <h2 id="modal-encounter-title" className="text-xl font-bold text-slate-900">
                  Encounter Diagnostic Profile
                </h2>
                <p className="text-xs text-slate-500">De-identified academic observation from Diabetes 130-US dataset</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close record modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Demographics & Admission */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-0.5 text-[11px]">Age Cohort</span>
                <span className="font-bold text-slate-800">{selectedRecord.age}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-0.5 text-[11px]">Gender</span>
                <span className="font-bold text-slate-800">{selectedRecord.gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-0.5 text-[11px]">Race</span>
                <span className="font-bold text-slate-800">{selectedRecord.race || 'Not Reported (?)'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-0.5 text-[11px]">De-identified Token</span>
                <span className="font-mono text-slate-600 text-[11px]">PT-••••{selectedRecord.patient_nbr.slice(-4)}</span>
              </div>
            </div>

            {/* Admission & Discharge Mapping */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-2">
              <h3 className="font-semibold text-blue-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" /> Mapped IDS Reference Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Admission Type (Code {selectedRecord.admission_type_id})</span>
                  <span className="font-medium text-slate-800">{selectedRecord.admission_type_desc}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Discharge (Code {selectedRecord.discharge_disposition_id})</span>
                  <span className="font-medium text-slate-800">{selectedRecord.discharge_disposition_desc}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Source (Code {selectedRecord.admission_source_id})</span>
                  <span className="font-medium text-slate-800">{selectedRecord.admission_source_desc}</span>
                </div>
              </div>
            </div>

            {/* Clinical & LOS Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[11px] font-semibold text-blue-700 block">Length of Stay</span>
                <span className="text-2xl font-extrabold text-blue-800 font-mono">{selectedRecord.time_in_hospital} d</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Lab Tests</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{selectedRecord.num_lab_procedures}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Procedures</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{selectedRecord.num_procedures}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Medications</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{selectedRecord.num_medications}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Diagnoses</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{selectedRecord.number_diagnoses}</span>
              </div>
            </div>

            {/* Diagnostic Classification */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <h3 className="font-semibold text-slate-900">Diagnosis Assessment (ICD-9 Mapping)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Diagnosis (diag_1)</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRecord.diag_1 || 'Missing (?)'}</span>
                  <span className="text-xs text-blue-700 block mt-0.5">{selectedRecord.diag_1_category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Secondary Diagnosis (diag_2)</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRecord.diag_2 || 'None / Missing'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tertiary Diagnosis (diag_3)</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRecord.diag_3 || 'None / Missing'}</span>
                </div>
              </div>
            </div>

            {/* Laboratory & Medication Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">A1C Result</span>
                <span className="font-semibold text-slate-800">{selectedRecord.A1Cresult || 'None'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Max Glucose Serum</span>
                <span className="font-semibold text-slate-800">{selectedRecord.max_glu_serum || 'None'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Insulin Prescribed</span>
                <span className="font-semibold text-slate-800">{selectedRecord.insulin}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Readmission</span>
                <span className="font-bold text-blue-800">{selectedRecord.readmitted}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Close Encounter Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
