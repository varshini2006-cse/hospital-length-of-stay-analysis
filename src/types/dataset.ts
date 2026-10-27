/**
 * Core dataset types and schemas for Hospital Length-of-Stay Predictor Investigation
 * Dataset: Diabetes 130-US Hospitals (1999-2008), 101,766 encounters, 50 columns
 */

export const DATASET_METADATA = {
  name: 'Diabetes 130-US Hospitals (1999-2008)',
  expectedRows: 101766,
  expectedColumns: 50
} as const;

export interface RawEncounterRecord {
  encounter_id: string;
  patient_nbr: string;
  race: string;
  gender: string;
  age: string;
  weight: string;
  admission_type_id: string;
  discharge_disposition_id: string;
  admission_source_id: string;
  time_in_hospital: string;
  payer_code: string;
  medical_specialty: string;
  num_lab_procedures: string;
  num_procedures: string;
  num_medications: string;
  number_outpatient: string;
  number_emergency: string;
  number_inpatient: string;
  diag_1: string;
  diag_2: string;
  diag_3: string;
  number_diagnoses: string;
  max_glu_serum: string;
  A1Cresult: string;
  metformin: string;
  repaglinide: string;
  nateglinide: string;
  chlorpropamide: string;
  glimepiride: string;
  acetohexamide: string;
  glipizide: string;
  glyburide: string;
  tolbutamide: string;
  pioglitazone: string;
  rosiglitazone: string;
  acarbose: string;
  miglitol: string;
  troglitazone: string;
  tolazamide: string;
  examide: string;
  citoglipton: string;
  insulin: string;
  'glyburide-metformin': string;
  'glipizide-metformin': string;
  'glimepiride-pioglitazone': string;
  'metformin-rosiglitazone': string;
  'metformin-pioglitazone': string;
  change: string;
  diabetesMed: string;
  readmitted: string;
  [key: string]: string | undefined;
}

export interface CleanEncounterRecord {
  encounter_id: string;
  patient_nbr: string;
  race: string | null;
  gender: string;
  age: string;
  age_midpoint: number;
  weight: string | null;
  admission_type_id: number;
  admission_type_desc: string;
  discharge_disposition_id: number;
  discharge_disposition_desc: string;
  admission_source_id: number;
  admission_source_desc: string;
  time_in_hospital: number; // Target variable (1-14 days)
  payer_code: string | null;
  medical_specialty: string | null;
  num_lab_procedures: number;
  num_procedures: number;
  num_medications: number;
  number_outpatient: number;
  number_emergency: number;
  number_inpatient: number;
  diag_1: string | null;
  diag_2: string | null;
  diag_3: string | null;
  diag_1_category: string;
  number_diagnoses: number;
  max_glu_serum: string;
  A1Cresult: string;
  metformin: string;
  repaglinide: string;
  nateglinide: string;
  chlorpropamide: string;
  glimepiride: string;
  acetohexamide: string;
  glipizide: string;
  glyburide: string;
  tolbutamide: string;
  pioglitazone: string;
  rosiglitazone: string;
  acarbose: string;
  miglitol: string;
  troglitazone: string;
  tolazamide: string;
  examide: string;
  citoglipton: string;
  insulin: string;
  'glyburide-metformin': string;
  'glipizide-metformin': string;
  'glimepiride-pioglitazone': string;
  'metformin-rosiglitazone': string;
  'metformin-pioglitazone': string;
  change: string;
  diabetesMed: string;
  readmitted: string;
}

export interface IDSMappingItem {
  id: number;
  description: string;
  category: 'admission_type' | 'discharge_disposition' | 'admission_source';
  isInvalidOrNull: boolean;
}

export interface IDSMappingTables {
  admissionTypeMap: Map<number, string>;
  dischargeDispositionMap: Map<number, string>;
  admissionSourceMap: Map<number, string>;
  allMappings: {
    admission_types: IDSMappingItem[];
    discharge_dispositions: IDSMappingItem[];
    admission_sources: IDSMappingItem[];
  };
}

export type InferredDataType = 'numeric' | 'categorical' | 'identifier' | 'text';

export interface ColumnProfile {
  name: string;
  inferredType: InferredDataType;
  missingCount: number;
  missingPercentage: number;
  distinctCount: number;
  distinctValuesSample: string[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
}

export interface DatasetValidationReport {
  isSchemaValid: boolean;
  actualRowCount: number;
  expectedRowCount: number;
  actualColumnCount: number;
  expectedColumnCount: number;
  missingColumns: string[];
  extraColumns: string[];
  columnsWithMissingValues: {
    name: string;
    missingCount: number;
    missingPercentage: number;
  }[];
  timeInHospitalStats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    q1: number;
    q3: number;
    stdDev: number;
    total: number;
  };
  uniquePatientsCount: number;
  columnProfiles: Record<string, ColumnProfile>;
}

export type LoadingPhase = 
  | 'idle' 
  | 'fetching_ids' 
  | 'downloading_csv' 
  | 'parsing_csv' 
  | 'validating_schema' 
  | 'ready' 
  | 'error';

export interface LoadingProgress {
  phase: LoadingPhase;
  message: string;
  percentage: number;
  loadedBytes: number;
  totalBytes: number;
  parsedRows: number;
  totalExpectedRows: number;
}

export interface DashboardFilters {
  age: string; // 'ALL' or specific bracket e.g. '[70-80)'
  gender: string; // 'ALL' | 'Male' | 'Female'
  admissionType: string; // 'ALL' | specific admission_type_desc
  admissionSource: string; // 'ALL' | specific admission_source_desc
  dischargeDisposition: string; // 'ALL' | specific discharge_disposition_desc
  losRange: string; // 'ALL' | '1-3' | '4-7' | '8-14'
  readmission: string; // 'ALL' | 'NO' | '>30' | '<30'
  search: string; // text query for encounter_id, patient_nbr, diag_1_category
}

export const DEFAULT_FILTERS: DashboardFilters = {
  age: 'ALL',
  gender: 'ALL',
  admissionType: 'ALL',
  admissionSource: 'ALL',
  dischargeDisposition: 'ALL',
  losRange: 'ALL',
  readmission: 'ALL',
  search: ''
};

export interface FrequencyItem {
  category: string;
  count: number;
  percentage: number;
}

export interface GroupAggregationResult {
  group: string;
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface ModelEvaluationMetrics {
  n: number;
  mae: number;
  rmse: number;
  r2: number;
  meanResidual: number;
  actualMean: number;
  predMean: number;
}
