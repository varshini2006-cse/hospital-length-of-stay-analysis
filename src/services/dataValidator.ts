import type { ColumnProfile, DatasetValidationReport, RawEncounterRecord } from '../types/dataset';
import { calculateNumericSummary } from './statistics';

export const EXPECTED_COLUMNS: readonly string[] = [
  'encounter_id',
  'patient_nbr',
  'race',
  'gender',
  'age',
  'weight',
  'admission_type_id',
  'discharge_disposition_id',
  'admission_source_id',
  'time_in_hospital',
  'payer_code',
  'medical_specialty',
  'num_lab_procedures',
  'num_procedures',
  'num_medications',
  'number_outpatient',
  'number_emergency',
  'number_inpatient',
  'diag_1',
  'diag_2',
  'diag_3',
  'number_diagnoses',
  'max_glu_serum',
  'A1Cresult',
  'metformin',
  'repaglinide',
  'nateglinide',
  'chlorpropamide',
  'glimepiride',
  'acetohexamide',
  'glipizide',
  'glyburide',
  'tolbutamide',
  'pioglitazone',
  'rosiglitazone',
  'acarbose',
  'miglitol',
  'troglitazone',
  'tolazamide',
  'examide',
  'citoglipton',
  'insulin',
  'glyburide-metformin',
  'glipizide-metformin',
  'glimepiride-pioglitazone',
  'metformin-rosiglitazone',
  'metformin-pioglitazone',
  'change',
  'diabetesMed',
  'readmitted'
];

export const EXPECTED_ROW_COUNT = 101766;
export const EXPECTED_COLUMN_COUNT = 50;

const NUMERIC_COLUMNS = new Set([
  'admission_type_id',
  'discharge_disposition_id',
  'admission_source_id',
  'time_in_hospital',
  'num_lab_procedures',
  'num_procedures',
  'num_medications',
  'number_outpatient',
  'number_emergency',
  'number_inpatient',
  'number_diagnoses'
]);

const IDENTIFIER_COLUMNS = new Set([
  'encounter_id',
  'patient_nbr'
]);

export function validateAndProfileDataset(
  rawRows: RawEncounterRecord[],
  headerNames: string[]
): DatasetValidationReport {
  const actualRowCount = rawRows.length;
  const actualColumnCount = headerNames.length;

  const headerSet = new Set(headerNames);
  const expectedSet = new Set(EXPECTED_COLUMNS);

  const missingColumns = EXPECTED_COLUMNS.filter(col => !headerSet.has(col));
  const extraColumns = headerNames.filter(col => !expectedSet.has(col));

  const isSchemaValid = missingColumns.length === 0;

  // Initialize tracking containers
  const missingCounts: Record<string, number> = {};
  const distinctSets: Record<string, Set<string>> = {};
  const numericArrays: Record<string, number[]> = {};
  const uniquePatients = new Set<string>();
  const timeInHospitalValues: number[] = [];

  headerNames.forEach(col => {
    missingCounts[col] = 0;
    distinctSets[col] = new Set<string>();
    if (NUMERIC_COLUMNS.has(col)) {
      numericArrays[col] = [];
    }
  });

  // Single-pass inspection for maximum performance on 101,766 records
  for (let i = 0; i < actualRowCount; i++) {
    const row = rawRows[i];

    if (row.patient_nbr) {
      uniquePatients.add(row.patient_nbr);
    }

    const losVal = parseInt(row.time_in_hospital || '0', 10);
    if (!isNaN(losVal) && losVal > 0) {
      timeInHospitalValues.push(losVal);
    }

    for (let c = 0; c < headerNames.length; c++) {
      const col = headerNames[c];
      const val = row[col];

      // Missing-value detection (handles '?', '', undefined, 'NULL')
      if (val === undefined || val === null || val === '?' || val === '' || val.toUpperCase() === 'NULL') {
        missingCounts[col]++;
      } else {
        // Sample distinct values (cap set size to avoid memory bloat)
        if (distinctSets[col].size < 200) {
          distinctSets[col].add(val);
        }

        if (NUMERIC_COLUMNS.has(col)) {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            numericArrays[col].push(num);
          }
        }
      }
    }
  }

  // Build Column Profiles
  const columnProfiles: Record<string, ColumnProfile> = {};
  const columnsWithMissingValues: { name: string; missingCount: number; missingPercentage: number }[] = [];

  headerNames.forEach(col => {
    const missing = missingCounts[col];
    const missingPct = actualRowCount > 0 ? Number(((missing / actualRowCount) * 100).toFixed(2)) : 0;
    
    if (missing > 0) {
      columnsWithMissingValues.push({
        name: col,
        missingCount: missing,
        missingPercentage: missingPct
      });
    }

    let inferredType: 'numeric' | 'categorical' | 'identifier' | 'text' = 'categorical';
    if (IDENTIFIER_COLUMNS.has(col)) {
      inferredType = 'identifier';
    } else if (NUMERIC_COLUMNS.has(col)) {
      inferredType = 'numeric';
    } else if (distinctSets[col].size > 100) {
      inferredType = 'text';
    }

    let numStats: Partial<ColumnProfile> = {};
    if (NUMERIC_COLUMNS.has(col) && numericArrays[col] && numericArrays[col].length > 0) {
      const summary = calculateNumericSummary(numericArrays[col]);
      numStats = {
        min: summary.min,
        max: summary.max,
        mean: summary.mean,
        median: summary.median,
        stdDev: summary.stdDev
      };
    }

    columnProfiles[col] = {
      name: col,
      inferredType,
      missingCount: missing,
      missingPercentage: missingPct,
      distinctCount: distinctSets[col].size,
      distinctValuesSample: Array.from(distinctSets[col]).slice(0, 15),
      ...numStats
    };
  });

  // Sort missing columns by missingPercentage descending
  columnsWithMissingValues.sort((a, b) => b.missingPercentage - a.missingPercentage);

  const losSummary = calculateNumericSummary(timeInHospitalValues);

  return {
    isSchemaValid,
    actualRowCount,
    expectedRowCount: EXPECTED_ROW_COUNT,
    actualColumnCount,
    expectedColumnCount: EXPECTED_COLUMN_COUNT,
    missingColumns,
    extraColumns,
    columnsWithMissingValues,
    timeInHospitalStats: {
      min: losSummary.min,
      max: losSummary.max,
      mean: losSummary.mean,
      median: losSummary.median,
      q1: losSummary.q1,
      q3: losSummary.q3,
      stdDev: losSummary.stdDev,
      total: timeInHospitalValues.length
    },
    uniquePatientsCount: uniquePatients.size,
    columnProfiles
  };
}
