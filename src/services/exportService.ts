import type { CleanEncounterRecord } from '../types/dataset';

/**
 * Robust CSV string escaping conforming to RFC 4180
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If string contains comma, double-quote, or newline, escape with wrapping quotes and doubled double-quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Trigger client-side file download of CSV content
 */
export function triggerCSVDownload(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export filtered encounters to CSV
 * Note: patient_nbr is de-identified as requested (no unnecessary identifiers).
 */
export function exportEncountersToCSV(records: CleanEncounterRecord[], filename = 'filtered_clinical_encounters.csv'): void {
  const headers = [
    'encounter_id',
    'age',
    'gender',
    'race',
    'admission_type',
    'admission_source',
    'discharge_disposition',
    'time_in_hospital_days',
    'num_lab_procedures',
    'num_procedures',
    'num_medications',
    'number_diagnoses',
    'primary_diagnosis_category',
    'A1Cresult',
    'max_glu_serum',
    'insulin',
    'readmitted'
  ];

  const rows = records.map((r) => [
    r.encounter_id,
    r.age,
    r.gender,
    r.race || 'Not Reported',
    r.admission_type_desc,
    r.admission_source_desc,
    r.discharge_disposition_desc,
    r.time_in_hospital,
    r.num_lab_procedures,
    r.num_procedures,
    r.num_medications,
    r.number_diagnoses,
    r.diag_1_category,
    r.A1Cresult,
    r.max_glu_serum,
    r.insulin,
    r.readmitted
  ]);

  const csvContent = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(','))
  ].join('\r\n');

  triggerCSVDownload(filename, csvContent);
}

/**
 * Export structured analytical summary tables
 */
export function exportSummaryToCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  const csvContent = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(','))
  ].join('\r\n');

  triggerCSVDownload(filename, csvContent);
}

/**
 * Export a summary table with row-oriented headers (alias of exportSummaryToCSV).
 * Signature matches: exportSummaryTableToCSV(headers, rows, filename)
 */
export function exportSummaryTableToCSV(
  headers: string[],
  rows: Array<Array<string | number>>,
  filename: string
): void {
  exportSummaryToCSV(filename, headers, rows);
}
