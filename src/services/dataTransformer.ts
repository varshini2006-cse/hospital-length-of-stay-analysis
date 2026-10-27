import type { CleanEncounterRecord, RawEncounterRecord, IDSMappingTables } from '../types/dataset';
import { formatAdmissionSource, formatAdmissionType, formatDischargeDisposition } from './idMappingParser';

/**
 * Categorize ICD-9 primary diagnosis according to Strack et al. (2014) standard methodology
 */
export function categorizeICD9(diag: string | null | undefined): string {
  if (!diag || diag === '?' || diag === '') return 'Missing / Unspecified';
  
  if (diag.startsWith('250')) {
    return 'Diabetes Mellitus';
  }
  
  // Handle V and E codes
  if (diag.startsWith('V')) return 'Supplementary Health Factors (V-Code)';
  if (diag.startsWith('E')) return 'External Causes of Injury (E-Code)';
  
  const num = parseFloat(diag);
  if (isNaN(num)) return 'Other / Ill-defined';
  
  if ((num >= 390 && num <= 459) || num === 785) {
    return 'Circulatory System';
  } else if ((num >= 460 && num <= 519) || num === 786) {
    return 'Respiratory System';
  } else if ((num >= 520 && num <= 579) || num === 787) {
    return 'Digestive System';
  } else if (num >= 580 && num <= 629 || num === 788) {
    return 'Genitourinary System';
  } else if (num >= 800 && num <= 999) {
    return 'Injury and Poisoning';
  } else if (num >= 710 && num <= 739) {
    return 'Musculoskeletal System';
  } else if (num >= 140 && num <= 239) {
    return 'Neoplasms';
  } else if (num >= 680 && num <= 709) {
    return 'Skin and Subcutaneous Tissue';
  } else if (num >= 290 && num <= 319) {
    return 'Mental Disorders';
  } else if (num >= 240 && num <= 279) {
    return 'Endocrine & Metabolic (Non-Diabetes)';
  } else {
    return 'Other Diagnostic Category';
  }
}

/**
 * Convert age brackets like "[70-80)" to numeric midpoint
 */
export function parseAgeBracketToMidpoint(ageBracket: string): number {
  switch (ageBracket) {
    case '[0-10)': return 5;
    case '[10-20)': return 15;
    case '[20-30)': return 25;
    case '[30-40)': return 35;
    case '[40-50)': return 45;
    case '[50-60)': return 55;
    case '[60-70)': return 65;
    case '[70-80)': return 75;
    case '[80-90)': return 85;
    case '[90-100)': return 95;
    default: return 50;
  }
}

/**
 * Transform a raw CSV row into a strongly typed CleanEncounterRecord
 */
export function cleanRawEncounter(
  raw: RawEncounterRecord, 
  idsMaps?: IDSMappingTables
): CleanEncounterRecord {
  const sanitize = (val: string | undefined): string | null => {
    if (!val || val === '?' || val.trim() === '' || val.toUpperCase() === 'NULL') {
      return null;
    }
    return val.trim();
  };

  const admTypeId = parseInt(raw.admission_type_id || '0', 10);
  const disDispId = parseInt(raw.discharge_disposition_id || '0', 10);
  const admSrcId = parseInt(raw.admission_source_id || '0', 10);

  const cleanDiag1 = sanitize(raw.diag_1);

  return {
    encounter_id: raw.encounter_id || '',
    patient_nbr: raw.patient_nbr || '',
    race: sanitize(raw.race),
    gender: raw.gender === 'Unknown/Invalid' ? 'Unknown' : (raw.gender || 'Unknown'),
    age: raw.age || '[50-60)',
    age_midpoint: parseAgeBracketToMidpoint(raw.age || ''),
    weight: sanitize(raw.weight),
    admission_type_id: isNaN(admTypeId) ? 0 : admTypeId,
    admission_type_desc: formatAdmissionType(admTypeId, idsMaps?.admissionTypeMap),
    discharge_disposition_id: isNaN(disDispId) ? 0 : disDispId,
    discharge_disposition_desc: formatDischargeDisposition(disDispId, idsMaps?.dischargeDispositionMap),
    admission_source_id: isNaN(admSrcId) ? 0 : admSrcId,
    admission_source_desc: formatAdmissionSource(admSrcId, idsMaps?.admissionSourceMap),
    time_in_hospital: Math.max(1, parseInt(raw.time_in_hospital || '1', 10)),
    payer_code: sanitize(raw.payer_code),
    medical_specialty: sanitize(raw.medical_specialty),
    num_lab_procedures: parseInt(raw.num_lab_procedures || '0', 10) || 0,
    num_procedures: parseInt(raw.num_procedures || '0', 10) || 0,
    num_medications: parseInt(raw.num_medications || '0', 10) || 0,
    number_outpatient: parseInt(raw.number_outpatient || '0', 10) || 0,
    number_emergency: parseInt(raw.number_emergency || '0', 10) || 0,
    number_inpatient: parseInt(raw.number_inpatient || '0', 10) || 0,
    diag_1: cleanDiag1,
    diag_2: sanitize(raw.diag_2),
    diag_3: sanitize(raw.diag_3),
    diag_1_category: categorizeICD9(cleanDiag1),
    number_diagnoses: parseInt(raw.number_diagnoses || '0', 10) || 0,
    max_glu_serum: raw.max_glu_serum || 'None',
    A1Cresult: raw.A1Cresult || 'None',
    metformin: raw.metformin || 'No',
    repaglinide: raw.repaglinide || 'No',
    nateglinide: raw.nateglinide || 'No',
    chlorpropamide: raw.chlorpropamide || 'No',
    glimepiride: raw.glimepiride || 'No',
    acetohexamide: raw.acetohexamide || 'No',
    glipizide: raw.glipizide || 'No',
    glyburide: raw.glyburide || 'No',
    tolbutamide: raw.tolbutamide || 'No',
    pioglitazone: raw.pioglitazone || 'No',
    rosiglitazone: raw.rosiglitazone || 'No',
    acarbose: raw.acarbose || 'No',
    miglitol: raw.miglitol || 'No',
    troglitazone: raw.troglitazone || 'No',
    tolazamide: raw.tolazamide || 'No',
    examide: raw.examide || 'No',
    citoglipton: raw.citoglipton || 'No',
    insulin: raw.insulin || 'No',
    'glyburide-metformin': raw['glyburide-metformin'] || 'No',
    'glipizide-metformin': raw['glipizide-metformin'] || 'No',
    'glimepiride-pioglitazone': raw['glimepiride-pioglitazone'] || 'No',
    'metformin-rosiglitazone': raw['metformin-rosiglitazone'] || 'No',
    'metformin-pioglitazone': raw['metformin-pioglitazone'] || 'No',
    change: raw.change || 'No',
    diabetesMed: raw.diabetesMed || 'No',
    readmitted: raw.readmitted || 'NO'
  };
}
