import React, { useState } from 'react';
import type { LoadingProgress } from '../types/dataset';

interface LoadingScreenProps {
  progress: LoadingProgress;
  error: string | null;
  onRetry: () => void;
  onManualLoad: (dataFile: File, idsFile: File) => void;
}

const PHASES = ['fetching_ids', 'downloading_csv', 'parsing_csv', 'validating_schema', 'ready'] as const;

const PHASE_LABELS: Record<string, string> = {
  idle: 'Waiting',
  fetching_ids: 'Loading Reference Codes',
  downloading_csv: 'Downloading Dataset',
  parsing_csv: 'Parsing Encounters',
  validating_schema: 'Validating Schema',
  ready: 'Ready',
  error: 'Error'
};

export default function LoadingScreen({ progress, error, onRetry, onManualLoad }: LoadingScreenProps) {
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [idsFile, setIdsFile] = useState<File | null>(null);
  const [showManual, setShowManual] = useState(false);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (dataFile && idsFile) {
      onManualLoad(dataFile, idsFile);
      setShowManual(false);
    }
  }

  const phaseName = PHASE_LABELS[progress.phase] ?? progress.phase;
  const pct = Math.max(0, Math.min(100, progress.percentage));
  const currentPhaseIdx = PHASES.indexOf(progress.phase as typeof PHASES[number]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse" />
            Clinical Research Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mb-2 leading-tight">
            Hospital Length-of-Stay<br />
            <span className="text-[#B45309]">Predictor Investigation</span>
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm">
            Diabetes 130-US Hospitals · 1999–2008 · 101,766 Encounters
          </p>
        </div>

        {!error ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-[#374151]">{phaseName}</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-600">{pct}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
              <div
                className="h-2 rounded-full bg-[#FACC15] transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed min-h-[2.5rem]">{progress.message}</p>

            {/* Step indicators */}
            <div className="flex items-center">
              {PHASES.map((phase, i) => {
                const thisIdx = i;
                const isDone = thisIdx < currentPhaseIdx || progress.phase === 'ready';
                const isActive = thisIdx === currentPhaseIdx && progress.phase !== 'ready';
                return (
                  <React.Fragment key={phase}>
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                        isDone ? 'bg-[#FACC15] border-[#FACC15]' :
                        isActive ? 'border-amber-500 bg-amber-100 animate-pulse' :
                        'border-gray-300 bg-gray-100'
                      }`} />
                    </div>
                    {i < PHASES.length - 1 && (
                      <div className={`flex-1 h-px transition-colors duration-300 ${isDone ? 'bg-amber-300' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {progress.loadedBytes > 0 && progress.totalBytes > 0 && (
              <p className="text-xs text-[#6B7280] font-mono text-center">
                {(progress.loadedBytes / (1024 * 1024)).toFixed(1)} MB / {(progress.totalBytes / (1024 * 1024)).toFixed(1)} MB downloaded
              </p>
            )}
            {progress.parsedRows > 0 && (
              <p className="text-xs text-[#6B7280] font-mono text-center">
                {progress.parsedRows.toLocaleString()} rows parsed
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-5 border border-red-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-red-700 font-semibold mb-1">Dataset Load Failed</h2>
                <p className="text-sm text-[#4B5563] leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">How to fix</p>
              <ul className="text-xs sm:text-sm text-[#374151] space-y-1.5 list-none">
                {[
                  { file: 'public/data/diabetic_data.csv', desc: 'Primary 19 MB dataset' },
                  { file: 'public/data/IDS_mapping.csv', desc: 'Reference ID mapping' }
                ].map(({ file, desc }) => (
                  <li key={file} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    <code className="font-mono text-slate-800 bg-gray-100 px-1.5 py-0.5 rounded text-xs border border-gray-200">{file}</code>
                    <span className="text-xs text-[#6B7280]">— {desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="flex-1 px-4 py-2 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 text-sm font-semibold transition-colors shadow-2xs"
              >
                Retry Auto-Load
              </button>
              <button
                onClick={() => setShowManual(v => !v)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#374151] text-sm font-medium transition-colors border border-gray-200"
              >
                Upload Files Manually
              </button>
            </div>

            {showManual && (
              <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 border-t border-gray-200">
                {[
                  { label: 'diabetic_data.csv', setter: setDataFile },
                  { label: 'IDS_mapping.csv', setter: setIdsFile }
                ].map(({ label, setter }) => (
                  <div key={label}>
                    <label className="block text-xs text-[#4B5563] mb-1">{label}</label>
                    <input
                      type="file"
                      accept=".csv"
                      className="w-full text-xs text-[#374151] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-200 file:bg-gray-50 file:text-[#374151] file:text-xs file:cursor-pointer hover:file:bg-gray-100"
                      onChange={(e) => setter(e.target.files?.[0] ?? null)}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={!dataFile || !idsFile}
                  className="w-full px-4 py-2 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold transition-colors shadow-2xs"
                >
                  Load Selected Files
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#6B7280] mt-8">
          No mock data · Real dataset only · 101,766 clinical encounters
        </p>
      </div>
    </div>
  );
}
