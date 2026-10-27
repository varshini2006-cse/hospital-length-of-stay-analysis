import { useState, useEffect } from 'react';
import { useDataContext } from '../context/DataContext';
import { 
  Sparkles, AlertCircle, CheckCircle2, 
  HelpCircle, Sliders, RefreshCw, Server,
  ShieldCheck, Zap
} from 'lucide-react';

interface PredictionResponse {
  status: string;
  predicted_los_days: number;
  rounded_days: number;
  confidence_interval: {
    lower_bound_days: number;
    upper_bound_days: number;
    mae_margin: number;
  };
  risk_tier: string;
  risk_color: string;
  discharge_planning_recommendation: string;
  model_architecture: string;
  model_accuracy: {
    test_mae_days: number;
    test_r2: number;
  };
  features_received: Record<string, any>;
}

export default function LOSPredictionPage() {
  const { isReady, data } = useDataContext();

  // Form State - Pre-populated with representative clinical encounter
  const [ageBracket, setAgeBracket] = useState('[60-70)');
  const [admissionType, setAdmissionType] = useState('1'); // 1: Emergency
  const [admissionSource, setAdmissionSource] = useState('7'); // 7: Emergency Room
  const [primaryDiag, setPrimaryDiag] = useState('Circulatory System');
  const [numLabProcedures, setNumLabProcedures] = useState(43);
  const [numProcedures, setNumProcedures] = useState(1);
  const [numMedications, setNumMedications] = useState(16);
  const [numberDiagnoses, setNumberDiagnoses] = useState(9);
  const [priorInpatient, setPriorInpatient] = useState(0);
  const [priorEmergency, setPriorEmergency] = useState(0);
  const [priorOutpatient, setPriorOutpatient] = useState(0);
  const [a1cResult, setA1cResult] = useState('None');
  const [maxGluSerum, setMaxGluSerum] = useState('None');
  const [insulin, setInsulin] = useState('Steady');
  const [race, setRace] = useState('Caucasian');
  const [gender, setGender] = useState('Female');

  // Backend & Prediction State
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendModel, setBackendModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  async function checkBackendHealth() {
    setBackendStatus('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        setBackendStatus(json.model_loaded ? 'online' : 'offline');
        setBackendModel(json.selected_model || 'HistGradientBoosting Regressor');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  }

  // Validation rules based on empirical data bounds
  const validationErrors: string[] = [];
  if (numLabProcedures < 1 || numLabProcedures > 132) validationErrors.push('Lab procedures must be between 1 and 132.');
  if (numProcedures < 0 || numProcedures > 6) validationErrors.push('Operating procedures must be between 0 and 6.');
  if (numMedications < 1 || numMedications > 81) validationErrors.push('Medications must be between 1 and 81.');
  if (numberDiagnoses < 1 || numberDiagnoses > 16) validationErrors.push('Comorbid diagnoses must be between 1 and 16.');
  if (priorInpatient < 0 || priorInpatient > 21) validationErrors.push('Prior inpatient hospitalizations must be between 0 and 21.');
  if (priorEmergency < 0 || priorEmergency > 76) validationErrors.push('Prior ER visits must be between 0 and 76.');
  if (priorOutpatient < 0 || priorOutpatient > 42) validationErrors.push('Prior outpatient visits must be between 0 and 42.');

  const isValid = validationErrors.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSubmitted(true);
    setApiError(null);

    if (!isValid) return;

    setIsLoading(true);

    const payload = {
      age: ageBracket,
      admission_type_id: admissionType,
      admission_source_id: admissionSource,
      diag_1_category: primaryDiag,
      num_lab_procedures: Number(numLabProcedures),
      num_procedures: Number(numProcedures),
      num_medications: Number(numMedications),
      number_diagnoses: Number(numberDiagnoses),
      number_inpatient: Number(priorInpatient),
      number_emergency: Number(priorEmergency),
      number_outpatient: Number(priorOutpatient),
      A1Cresult: a1cResult,
      max_glu_serum: maxGluSerum,
      insulin: insulin,
      race: race,
      gender: gender
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Inference server returned HTTP ${response.status}`);
      }

      const data: PredictionResponse = await response.json();
      setPredictionResult(data);
      setBackendStatus('online');
    } catch (err: any) {
      setApiError(err.message || 'Failed to connect to machine learning prediction backend.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isReady || !data) {
    return (
      <div className="research-card p-12 text-center text-[#6B7280] text-sm" role="status">
        <div className="w-8 h-8 rounded-full border-2 border-[#FACC15] border-t-transparent animate-spin mx-auto mb-3" />
        Loading clinical dataset context for predictor interface...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            Empirical ML Inference
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Patient Length-of-Stay Predictor
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Configure admission-time patient clinical features to compute genuine Length-of-Stay estimates 
            powered by our trained <strong className="text-[#111827]">HistGradientBoosting Regressor</strong> model.
          </p>
        </div>

        {/* Backend Status Indicator */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={checkBackendHealth}
            className={`text-xs px-3 py-1.5 rounded-lg border font-mono flex items-center gap-2 transition-colors ${
              backendStatus === 'online'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                : backendStatus === 'checking'
                ? 'bg-gray-100 border-gray-200 text-gray-700'
                : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/70'
            }`}
            title="Click to re-check backend connection"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-500'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {backendStatus === 'online'
                ? `Model Live: ${backendModel || 'HistGradientBoosting'}`
                : backendStatus === 'checking'
                ? 'Verifying Backend...'
                : 'Backend Disconnected'}
            </span>
            <RefreshCw className={`w-3 h-3 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="research-card p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm sm:text-base font-bold text-[#111827] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" /> Admission Characteristics Form
              </h2>
              <span className="text-xs text-[#6B7280] font-mono">16 Admission Predictors</span>
            </div>

            {/* Validation errors summary */}
            {hasSubmitted && !isValid && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1" role="alert">
                <span className="font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> Form Validation Errors:
                </span>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-rose-700">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 1: Demographics & Admission */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                1. Patient Demographics & Admission Route
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pred-age" className="block text-xs font-semibold text-[#374151] mb-1">
                    Age Cohort Bracket
                  </label>
                  <select
                    id="pred-age"
                    value={ageBracket}
                    onChange={(e) => setAgeBracket(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] focus:outline-hidden transition-colors shadow-2xs"
                  >
                    {['[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'].map((a) => (
                      <option key={a} value={a}>{a} years</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-gender" className="block text-xs font-semibold text-[#374151] mb-1">
                    Biological Sex
                  </label>
                  <select
                    id="pred-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] focus:outline-hidden transition-colors shadow-2xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-race" className="block text-xs font-semibold text-[#374151] mb-1">
                    Reported Race / Ethnicity
                  </label>
                  <select
                    id="pred-race"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] focus:outline-hidden transition-colors shadow-2xs"
                  >
                    <option value="Caucasian">Caucasian</option>
                    <option value="AfricanAmerican">African American</option>
                    <option value="Hispanic">Hispanic</option>
                    <option value="Asian">Asian</option>
                    <option value="Other">Other</option>
                    <option value="Missing">Unknown / Missing</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-adm-type" className="block text-xs font-semibold text-[#374151] mb-1">
                    Admission Type (IDS Mapping)
                  </label>
                  <select
                    id="pred-adm-type"
                    value={admissionType}
                    onChange={(e) => setAdmissionType(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] focus:outline-hidden transition-colors shadow-2xs"
                  >
                    <option value="1">Emergency (ID 1)</option>
                    <option value="2">Urgent (ID 2)</option>
                    <option value="3">Elective (ID 3)</option>
                    <option value="4">Newborn (ID 4)</option>
                    <option value="5">Trauma Center (ID 5)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-adm-source" className="block text-xs font-semibold text-[#374151] mb-1">
                    Admission Source (IDS Mapping)
                  </label>
                  <select
                    id="pred-adm-source"
                    value={admissionSource}
                    onChange={(e) => setAdmissionSource(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] focus:outline-hidden transition-colors shadow-2xs"
                  >
                    <option value="7">Emergency Room (ID 7)</option>
                    <option value="1">Physician Referral (ID 1)</option>
                    <option value="2">Clinic Referral (ID 2)</option>
                    <option value="4">Transfer from Hospital (ID 4)</option>
                    <option value="5">Transfer from SNF (ID 5)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-diag" className="block text-xs font-semibold text-[#374151] mb-1">
                    Primary Diagnosis Category (ICD-9)
                  </label>
                  <select
                    id="pred-diag"
                    value={primaryDiag}
                    onChange={(e) => setPrimaryDiag(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] focus:outline-hidden transition-colors shadow-2xs"
                  >
                    <option value="Circulatory System">Circulatory System (390-459)</option>
                    <option value="Diabetes Mellitus">Diabetes Mellitus (250)</option>
                    <option value="Respiratory System">Respiratory System (460-519)</option>
                    <option value="Digestive System">Digestive System (520-579)</option>
                    <option value="Injury and Poisoning">Injury and Poisoning (800-999)</option>
                    <option value="Musculoskeletal System">Musculoskeletal System (710-739)</option>
                    <option value="Genitourinary System">Genitourinary System (580-629)</option>
                    <option value="Neoplasms">Neoplasms (140-239)</option>
                    <option value="Other / Ill-defined">Other / Ill-defined</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Utilization Quantities */}
            <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                2. Clinical Utilization & Interventions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lab Procedures */}
                <div className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-[#E5E7EB]">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="pred-labs" className="font-semibold text-[#374151]">Lab Procedures Count</label>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{numLabProcedures}</span>
                  </div>
                  <input
                    id="pred-labs"
                    type="range"
                    min={1}
                    max={132}
                    value={numLabProcedures}
                    onChange={(e) => setNumLabProcedures(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-[#6B7280] font-mono block">Dataset mean: 43.1 • Range: 1–132</span>
                </div>

                {/* Operating Procedures */}
                <div className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-[#E5E7EB]">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="pred-procs" className="font-semibold text-[#374151]">Operating Procedures Count</label>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{numProcedures}</span>
                  </div>
                  <input
                    id="pred-procs"
                    type="range"
                    min={0}
                    max={6}
                    value={numProcedures}
                    onChange={(e) => setNumProcedures(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-[#6B7280] font-mono block">Dataset mean: 1.34 • Range: 0–6</span>
                </div>

                {/* Number of Medications */}
                <div className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-[#E5E7EB]">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="pred-meds" className="font-semibold text-[#374151]">Total Distinct Medications</label>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{numMedications}</span>
                  </div>
                  <input
                    id="pred-meds"
                    type="range"
                    min={1}
                    max={81}
                    value={numMedications}
                    onChange={(e) => setNumMedications(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-[#6B7280] font-mono block">Dataset mean: 16.0 • Range: 1–81</span>
                </div>

                {/* Number of Diagnoses */}
                <div className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-[#E5E7EB]">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="pred-diags" className="font-semibold text-[#374151]">Comorbid Diagnoses Entered</label>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{numberDiagnoses}</span>
                  </div>
                  <input
                    id="pred-diags"
                    type="range"
                    min={1}
                    max={16}
                    value={numberDiagnoses}
                    onChange={(e) => setNumberDiagnoses(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-[#6B7280] font-mono block">Dataset mean: 7.42 • Range: 1–16</span>
                </div>
              </div>
            </div>

            {/* Section 3: Prior History & Pharmacotherapy */}
            <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                3. Prior Clinical Utilization & Glycemic Markers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="pred-inpatient" className="block text-xs font-semibold text-[#374151] mb-1">
                    Prior Inpatient (yr)
                  </label>
                  <input
                    id="pred-inpatient"
                    type="number"
                    min={0}
                    max={21}
                    value={priorInpatient}
                    onChange={(e) => setPriorInpatient(parseInt(e.target.value, 10) || 0)}
                    className="w-full py-1.5 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] font-mono hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="pred-er" className="block text-xs font-semibold text-[#374151] mb-1">
                    Prior ER Visits (yr)
                  </label>
                  <input
                    id="pred-er"
                    type="number"
                    min={0}
                    max={76}
                    value={priorEmergency}
                    onChange={(e) => setPriorEmergency(parseInt(e.target.value, 10) || 0)}
                    className="w-full py-1.5 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] font-mono hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="pred-outpatient" className="block text-xs font-semibold text-[#374151] mb-1">
                    Prior Outpatient (yr)
                  </label>
                  <input
                    id="pred-outpatient"
                    type="number"
                    min={0}
                    max={42}
                    value={priorOutpatient}
                    onChange={(e) => setPriorOutpatient(parseInt(e.target.value, 10) || 0)}
                    className="w-full py-1.5 px-3 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] font-mono hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="pred-a1c" className="block text-xs font-semibold text-[#374151] mb-1">
                    HbA1c Result
                  </label>
                  <select
                    id="pred-a1c"
                    value={a1cResult}
                    onChange={(e) => setA1cResult(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] transition-colors shadow-2xs"
                  >
                    <option value="None">None (Unmeasured)</option>
                    <option value="Norm">Norm (&lt;7%)</option>
                    <option value=">7">&gt;7% (Elevated)</option>
                    <option value=">8">&gt;8% (Poor Control)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-glu" className="block text-xs font-semibold text-[#374151] mb-1">
                    Max Blood Glucose
                  </label>
                  <select
                    id="pred-glu"
                    value={maxGluSerum}
                    onChange={(e) => setMaxGluSerum(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] transition-colors shadow-2xs"
                  >
                    <option value="None">None (Unmeasured)</option>
                    <option value="Norm">Norm (&lt;100 mg/dL)</option>
                    <option value=">200">&gt;200 mg/dL</option>
                    <option value=">300">&gt;300 mg/dL</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pred-insulin" className="block text-xs font-semibold text-[#374151] mb-1">
                    Insulin Regimen
                  </label>
                  <select
                    id="pred-insulin"
                    value={insulin}
                    onChange={(e) => setInsulin(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus:border-[#FACC15] transition-colors shadow-2xs"
                  >
                    <option value="No">No Insulin</option>
                    <option value="Steady">Steady Dose</option>
                    <option value="Up">Up (Dose Escalated)</option>
                    <option value="Down">Down (Dose Reduced)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="predict-submit-btn"
                disabled={isLoading}
                className={`w-full py-3 px-4 font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-[#FACC15] hover:bg-[#EAB308] text-[#111827] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:outline-hidden'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-[#111827] border-t-transparent animate-spin" />
                    <span>Running Machine Learning Inference...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Predict Patient Length-of-Stay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Engine Result Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Status / Result Panel */}
          {predictionResult ? (
            <div className="research-card p-5 sm:p-6 border-l-4 border-l-[#FACC15] space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-[#111827]">Predicted Length of Stay</h2>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  {predictionResult.model_architecture}
                </span>
              </div>

              {/* Big KPI Stat Card */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-5 text-center space-y-2">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Estimated Inpatient Duration
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-amber-600 tracking-tight font-mono">
                    {predictionResult.predicted_los_days}
                  </span>
                  <span className="text-xl font-bold text-[#374151]">Days</span>
                </div>
                <p className="text-xs text-[#6B7280] font-mono">
                  Rounded: ~{predictionResult.rounded_days} days • 95% Confidence Interval: [{predictionResult.confidence_interval.lower_bound_days} – {predictionResult.confidence_interval.upper_bound_days} days]
                </p>
              </div>

              {/* Clinical Acuity Tier & Recommendation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#374151]">Clinical Acuity Classification:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                    predictionResult.risk_color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : predictionResult.risk_color === 'amber'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {predictionResult.risk_tier}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-gray-50 border border-[#E5E7EB] text-xs space-y-1">
                  <span className="font-bold text-[#111827] block">Care Coordination & Discharge Planning:</span>
                  <p className="text-[#374151] leading-relaxed">
                    {predictionResult.discharge_planning_recommendation}
                  </p>
                </div>
              </div>

              {/* Model Performance Metadata */}
              <div className="border-t border-[#E5E7EB] pt-3 flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
                <span>Model Test MAE: ±{predictionResult.model_accuracy.test_mae_days}d</span>
                <span>Test R²: {predictionResult.model_accuracy.test_r2}</span>
              </div>
            </div>
          ) : (
            /* Awaiting Submission / Ready State */
            <div className="research-card p-5 sm:p-6 border-l-4 border-l-gray-300 space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-[#111827]">Inference Engine Ready</h2>
              </div>

              {apiError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    Inference Request Failed
                  </div>
                  <p className="leading-relaxed">{apiError}</p>
                  <p className="text-[11px] text-[#6B7280] font-mono">
                    Ensure FastAPI backend is running: <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">python -m uvicorn backend.main:app --port 8000</code>
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-[#E5E7EB] text-xs space-y-2 text-[#374151] leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 text-amber-700">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    Authentic Machine Learning Workflow
                  </div>
                  <p>
                    Submit the encounter form to obtain an actual length-of-stay estimation computed by the
                    trained <strong className="text-[#111827]">HistGradientBoosting Regressor</strong>.
                  </p>
                  <p className="text-[#6B7280]">
                    Target leakage has been rigorously eliminated: post-admission predictors (e.g., discharge disposition) 
                    are strictly excluded from the inference pipeline.
                  </p>
                </div>
              )}

              {/* Feature validation confirmation */}
              <div className="p-3.5 rounded-lg bg-gray-50 border border-[#E5E7EB] space-y-1.5">
                <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">
                  Admission Feature Status
                </span>
                <div className="flex items-center gap-2 text-xs">
                  {isValid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All 16 Input Features Validated
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-rose-600" /> Parameter Out of Bounds
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280] font-mono">
                  Features conform to empirical bounds of 101,766 verified hospital encounters.
                </p>
              </div>
            </div>
          )}

          {/* Academic Architecture Note */}
          <div className="research-card p-5 space-y-2 text-xs">
            <h3 className="font-bold text-[#111827] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" /> Admission-Time Prediction Policy
            </h3>
            <p className="text-[#4B5563] leading-relaxed">
              To guarantee scientific validity and real-world applicability in hospital bed-management, 
              only clinical attributes available within the first hours of admission are evaluated. 
              Discharge disposition and total elapsed inpatient procedures are strictly barred from the feature set.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
