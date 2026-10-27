import Papa from 'papaparse';
import type { 
  CleanEncounterRecord, 
  DatasetValidationReport, 
  IDSMappingTables, 
  LoadingProgress, 
  RawEncounterRecord 
} from '../types/dataset';
import { parseIDSMappingCSV } from './idMappingParser';
import { validateAndProfileDataset } from './dataValidator';
import { cleanRawEncounter } from './dataTransformer';

export interface DatasetLoadedResult {
  rawRecords: RawEncounterRecord[];
  cleanRecords: CleanEncounterRecord[];
  idsMapping: IDSMappingTables;
  validationReport: DatasetValidationReport;
  headerNames: string[];
}

export class DatasetLoaderService {
  private static readonly DATA_CSV_PATH = '/data/diabetic_data.csv';
  private static readonly IDS_CSV_PATH = '/data/IDS_mapping.csv';

  /**
   * Primary loader: loads the real dataset from public data directory
   */
  public static async loadDataset(
    onProgress: (progress: LoadingProgress) => void
  ): Promise<DatasetLoadedResult> {
    try {
      // Step 1: Fetch & parse IDS_mapping.csv
      onProgress({
        phase: 'fetching_ids',
        message: 'Fetching and parsing IDS_mapping.csv reference codes...',
        percentage: 10,
        loadedBytes: 0,
        totalBytes: 2547,
        parsedRows: 0,
        totalExpectedRows: 101766
      });

      const idsResponse = await fetch(this.IDS_CSV_PATH);
      if (!idsResponse.ok) {
        throw new Error(
          `Unable to load reference file "${this.IDS_CSV_PATH}" (HTTP ${idsResponse.status}: ${idsResponse.statusText}). ` +
          `Please confirm IDS_mapping.csv is located in public/data/IDS_mapping.csv.`
        );
      }
      const idsCsvText = await idsResponse.text();
      const idsMapping = parseIDSMappingCSV(idsCsvText);

      // Step 2: Stream download diabetic_data.csv with byte progress
      onProgress({
        phase: 'downloading_csv',
        message: 'Downloading diabetic_data.csv (19.16 MB, 101,766 records)...',
        percentage: 20,
        loadedBytes: 0,
        totalBytes: 19159383,
        parsedRows: 0,
        totalExpectedRows: 101766
      });

      const dataResponse = await fetch(this.DATA_CSV_PATH);
      if (!dataResponse.ok) {
        throw new Error(
          `Unable to load primary dataset "${this.DATA_CSV_PATH}" (HTTP ${dataResponse.status}: ${dataResponse.statusText}). ` +
          `Please confirm diabetic_data.csv is present in public/data/diabetic_data.csv.`
        );
      }

      const contentLength = dataResponse.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 19159383;

      let csvText = '';
      if (dataResponse.body) {
        const reader = dataResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let receivedBytes = 0;
        let chunks: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedBytes += value.length;
          chunks.push(decoder.decode(value, { stream: true }));

          const downloadPct = Math.min(60, 20 + Math.round((receivedBytes / totalBytes) * 40));
          onProgress({
            phase: 'downloading_csv',
            message: `Streaming dataset bytes: ${(receivedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB...`,
            percentage: downloadPct,
            loadedBytes: receivedBytes,
            totalBytes,
            parsedRows: 0,
            totalExpectedRows: 101766
          });
        }
        chunks.push(decoder.decode());
        csvText = chunks.join('');
      } else {
        csvText = await dataResponse.text();
      }

      // Step 3: Parse CSV using PapaParse
      onProgress({
        phase: 'parsing_csv',
        message: 'Parsing 101,766 clinical encounters and normalizing sentinels...',
        percentage: 65,
        loadedBytes: totalBytes,
        totalBytes,
        parsedRows: 0,
        totalExpectedRows: 101766
      });

      const parseResult = await this.parseCSVString(csvText, (parsedCount) => {
        const parsePct = Math.min(85, 65 + Math.round((parsedCount / 101766) * 20));
        onProgress({
          phase: 'parsing_csv',
          message: `Parsed ${parsedCount.toLocaleString()} / 101,766 encounter rows...`,
          percentage: parsePct,
          loadedBytes: totalBytes,
          totalBytes,
          parsedRows: parsedCount,
          totalExpectedRows: 101766
        });
      });

      const rawRecords = parseResult.data as RawEncounterRecord[];
      const headerNames = parseResult.meta.fields || [];

      // Step 4: Validate schema and compute profile statistics
      onProgress({
        phase: 'validating_schema',
        message: 'Validating column schema, null rates, and empirical LOS parameters...',
        percentage: 90,
        loadedBytes: totalBytes,
        totalBytes,
        parsedRows: rawRecords.length,
        totalExpectedRows: 101766
      });

      const validationReport = validateAndProfileDataset(rawRecords, headerNames);

      // Step 5: Clean and transform records
      onProgress({
        phase: 'validating_schema',
        message: 'Constructing transformed clean dataset with joined ID descriptions...',
        percentage: 95,
        loadedBytes: totalBytes,
        totalBytes,
        parsedRows: rawRecords.length,
        totalExpectedRows: 101766
      });

      const cleanRecords: CleanEncounterRecord[] = new Array(rawRecords.length);
      for (let i = 0; i < rawRecords.length; i++) {
        cleanRecords[i] = cleanRawEncounter(rawRecords[i], idsMapping);
      }

      onProgress({
        phase: 'ready',
        message: `Dataset verified! Loaded ${cleanRecords.length.toLocaleString()} records across 50 columns.`,
        percentage: 100,
        loadedBytes: totalBytes,
        totalBytes,
        parsedRows: cleanRecords.length,
        totalExpectedRows: 101766
      });

      return {
        rawRecords,
        cleanRecords,
        idsMapping,
        validationReport,
        headerNames
      };

    } catch (err: any) {
      onProgress({
        phase: 'error',
        message: err.message || 'An unexpected error occurred while loading dataset.',
        percentage: 0,
        loadedBytes: 0,
        totalBytes: 0,
        parsedRows: 0,
        totalExpectedRows: 101766
      });
      throw err;
    }
  }

  /**
   * Manual file-drop loader fallback (allows user to select their local files directly)
   */
  public static async loadFromFiles(
    dataFile: File,
    idsFile: File,
    onProgress: (progress: LoadingProgress) => void
  ): Promise<DatasetLoadedResult> {
    onProgress({
      phase: 'fetching_ids',
      message: `Reading local reference mapping ${idsFile.name}...`,
      percentage: 10,
      loadedBytes: 0,
      totalBytes: idsFile.size,
      parsedRows: 0,
      totalExpectedRows: 101766
    });

    const idsText = await idsFile.text();
    const idsMapping = parseIDSMappingCSV(idsText);

    onProgress({
      phase: 'downloading_csv',
      message: `Reading local dataset ${dataFile.name} (${(dataFile.size / (1024 * 1024)).toFixed(1)} MB)...`,
      percentage: 30,
      loadedBytes: dataFile.size,
      totalBytes: dataFile.size,
      parsedRows: 0,
      totalExpectedRows: 101766
    });

    const dataText = await dataFile.text();

    onProgress({
      phase: 'parsing_csv',
      message: 'Parsing CSV data with PapaParse...',
      percentage: 60,
      loadedBytes: dataFile.size,
      totalBytes: dataFile.size,
      parsedRows: 0,
      totalExpectedRows: 101766
    });

    const parseResult = await this.parseCSVString(dataText, (count) => {
      onProgress({
        phase: 'parsing_csv',
        message: `Parsed ${count.toLocaleString()} rows...`,
        percentage: 60 + Math.round((count / 101766) * 25),
        loadedBytes: dataFile.size,
        totalBytes: dataFile.size,
        parsedRows: count,
        totalExpectedRows: 101766
      });
    });

    const rawRecords = parseResult.data as RawEncounterRecord[];
    const headerNames = parseResult.meta.fields || [];

    const validationReport = validateAndProfileDataset(rawRecords, headerNames);

    const cleanRecords: CleanEncounterRecord[] = new Array(rawRecords.length);
    for (let i = 0; i < rawRecords.length; i++) {
      cleanRecords[i] = cleanRawEncounter(rawRecords[i], idsMapping);
    }

    onProgress({
      phase: 'ready',
      message: `Successfully loaded ${cleanRecords.length.toLocaleString()} records from local file.`,
      percentage: 100,
      loadedBytes: dataFile.size,
      totalBytes: dataFile.size,
      parsedRows: cleanRecords.length,
      totalExpectedRows: 101766
    });

    return {
      rawRecords,
      cleanRecords,
      idsMapping,
      validationReport,
      headerNames
    };
  }

  private static parseCSVString(
    csvText: string,
    onRowBatch?: (count: number) => void
  ): Promise<{ data: RawEncounterRecord[]; meta: Papa.ParseMeta; errors: Papa.ParseError[] }> {
    return new Promise((resolve, reject) => {
      const records: RawEncounterRecord[] = [];
      let metaFields: string[] = [];

      Papa.parse<RawEncounterRecord>(csvText, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: 'greedy',
        chunk: (results: Papa.ParseResult<RawEncounterRecord>) => {
          if (results.meta?.fields && metaFields.length === 0) {
            metaFields = results.meta.fields;
          }
          if (results.data && results.data.length > 0) {
            for (let i = 0; i < results.data.length; i++) {
              records.push(results.data[i]);
            }
          }
          if (onRowBatch) {
            onRowBatch(records.length);
          }
        },
        complete: (results) => {
          resolve({
            data: records,
            meta: results?.meta ?? {
              delimiter: ',',
              linebreak: '\n',
              aborted: false,
              truncated: false,
              cursor: 0,
              fields: metaFields
            },
            errors: results?.errors ?? []
          });
        },
        error: (error: Error) => {
          reject(new Error(`CSV Parsing failed: ${error.message}`));
        }
      });
    });
  }
}
