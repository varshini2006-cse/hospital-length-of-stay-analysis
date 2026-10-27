import type { IDSMappingItem, IDSMappingTables } from '../types/dataset';

/**
 * Service to parse multi-section IDS_mapping.csv
 * The file contains three distinct reference tables separated by blank lines:
 * 1. admission_type_id,description
 * 2. discharge_disposition_id,description
 * 3. admission_source_id,description
 */

export function parseIDSMappingCSV(csvText: string): IDSMappingTables {
  const lines = csvText.split(/\r?\n/);
  
  const admissionTypeMap = new Map<number, string>();
  const dischargeDispositionMap = new Map<number, string>();
  const admissionSourceMap = new Map<number, string>();

  const admission_types: IDSMappingItem[] = [];
  const discharge_dispositions: IDSMappingItem[] = [];
  const admission_sources: IDSMappingItem[] = [];

  type ActiveSection = 'none' | 'admission_type' | 'discharge_disposition' | 'admission_source';
  let currentSection: ActiveSection = 'none';

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    if (!rawLine) continue;

    // Detect section headers
    if (rawLine.startsWith('admission_type_id')) {
      currentSection = 'admission_type';
      continue;
    } else if (rawLine.startsWith('discharge_disposition_id')) {
      currentSection = 'discharge_disposition';
      continue;
    } else if (rawLine.startsWith('admission_source_id')) {
      currentSection = 'admission_source';
      continue;
    }

    // Ignore empty lines with trailing comma or spaces
    if (rawLine === ',' || rawLine === '') {
      continue;
    }

    // Parse the id,description line
    // Some descriptions have quotes (e.g. "Expired at home. Medicaid only, hospice.")
    const firstCommaIndex = rawLine.indexOf(',');
    if (firstCommaIndex === -1) continue;

    const idStr = rawLine.slice(0, firstCommaIndex).trim();
    let desc = rawLine.slice(firstCommaIndex + 1).trim();

    // Strip wrapping quotes if present
    if (desc.startsWith('"') && desc.endsWith('"')) {
      desc = desc.slice(1, -1).trim();
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) continue;

    const isInvalidOrNull = 
      !desc || 
      desc.toUpperCase() === 'NULL' || 
      desc.toLowerCase().includes('not available') || 
      desc.toLowerCase().includes('not mapped') || 
      desc.toLowerCase().includes('unknown');

    const cleanDesc = desc || `Unspecified (ID ${id})`;

    const item: IDSMappingItem = {
      id,
      description: cleanDesc,
      category: currentSection === 'admission_type' 
        ? 'admission_type' 
        : currentSection === 'discharge_disposition' 
        ? 'discharge_disposition' 
        : 'admission_source',
      isInvalidOrNull
    };

    if (currentSection === 'admission_type') {
      admissionTypeMap.set(id, cleanDesc);
      admission_types.push(item);
    } else if (currentSection === 'discharge_disposition') {
      dischargeDispositionMap.set(id, cleanDesc);
      discharge_dispositions.push(item);
    } else if (currentSection === 'admission_source') {
      admissionSourceMap.set(id, cleanDesc);
      admission_sources.push(item);
    }
  }

  return {
    admissionTypeMap,
    dischargeDispositionMap,
    admissionSourceMap,
    allMappings: {
      admission_types,
      discharge_dispositions,
      admission_sources
    }
  };
}

export function formatAdmissionType(id: number, map?: Map<number, string>): string {
  if (!map) return `Admission Type #${id}`;
  return map.get(id) ?? `Unknown Type (${id})`;
}

export function formatDischargeDisposition(id: number, map?: Map<number, string>): string {
  if (!map) return `Discharge Disp #${id}`;
  return map.get(id) ?? `Unknown Disposition (${id})`;
}

export function formatAdmissionSource(id: number, map?: Map<number, string>): string {
  if (!map) return `Source #${id}`;
  return map.get(id) ?? `Unknown Source (${id})`;
}
