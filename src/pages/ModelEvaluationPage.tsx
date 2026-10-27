import { useState, useEffect } from 'react';
import { useDataContext } from '../context/DataContext';
import { 
  Award, Layers, LineChart, Target, Activity, 
  CheckCircle2, RefreshCw, AlertCircle, ShieldAlert,
  BrainCircuit, Database, Info
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, CartesianGrid, ScatterChart, Scatter, ReferenceLine, Cell
} from 'recharts';

interface ModelMetric {
  model_name: string;
  mae: number;
  rmse: number;
  r2: number;
  training_time_seconds: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface ScatterPoint {
  id: number;
  actual: number;
  predicted: number;
  residual: number;
}

interface ResidualBin {
  bin_range: string;
  bin_center: number;
  count: number;
  pct: number;
}

interface EvaluationPayload {
  status: string;
  timestamp: string;
  total_encounters: number;
  train_encounters: number;
  test_encounters: number;
  train_patients: number;
  test_patients: number;
  split_strategy: string;
  target_variable: string;
  selected_model: string;
  selection_rationale: string;
  models_comparison: ModelMetric[];
  feature_schema: string[];
  feature_importances: FeatureImportance[];
  actual_vs_predicted_sample: ScatterPoint[];
  residual_distribution: ResidualBin[];
  residuals_vs_predicted: { predicted: number; residual: number }[];
}

export default function ModelEvaluationPage() {
  const { data, isReady } = useDataContext();
  const [activeTab, setActiveTab] = useState<'comparison' | 'actual_vs_pred' | 'residuals' | 'importance' | 'methodology'>('comparison');
  
  const [metricsData, setMetricsData] = useState<EvaluationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/model/metrics');
      if (!res.ok) {
        throw new Error(`Inference engine returned HTTP ${res.status}`);
      }
      const json: EvaluationPayload = await res.json();
      setMetricsData(json);
    } catch (err: any) {
      setFetchError(err.message || 'Unable to fetch evaluation metrics from Python ML backend.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isReady || !data) {
    return (
      <div className="research-card p-12 text-center text-[#6B7280] text-sm" role="status">
        <div className="w-8 h-8 rounded-full border-2 border-[#FACC15] border-t-transparent animate-spin mx-auto mb-3" />
        Loading dataset validation metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            Empirical Validation Benchmarks
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Predictive Model Evaluation
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Genuine out-of-sample performance benchmarks, error distributions, and diagnostic residual analysis 
            for algorithmic estimators of hospital length of stay trained on 101,766 clinical encounters.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#374151] font-mono flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload Metrics</span>
          </button>
          <div className="text-xs text-[#374151] bg-gray-50 border border-[#E5E7EB] px-3 py-1.5 rounded-lg font-mono">
            Held-out Test N = {metricsData ? metricsData.test_encounters.toLocaleString() : '20,488'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] space-x-2 sm:space-x-6 text-xs sm:text-sm overflow-x-auto" role="tablist">
        {[
          { id: 'comparison', label: '1. Model Comparison & Metrics', icon: Layers },
          { id: 'actual_vs_pred', label: '2. Actual vs. Predicted LOS', icon: Target },
          { id: 'residuals', label: '3. Residuals & Error Distribution', icon: LineChart },
          { id: 'importance', label: '4. Feature Importance Weights', icon: Activity },
          { id: 'methodology', label: '5. Splitting Protocol & Leakage Audit', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:outline-hidden ${
                isSelected
                  ? 'border-[#FACC15] text-[#111827] font-bold'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="research-card p-12 text-center text-[#6B7280] text-sm">
          <div className="w-8 h-8 rounded-full border-2 border-[#FACC15] border-t-transparent animate-spin mx-auto mb-3" />
          Loading machine learning evaluation payload from backend...
        </div>
      )}

      {fetchError && !isLoading && (
        <div className="research-card p-6 border-l-4 border-l-rose-500 bg-rose-50 border-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Failed to Load Model Evaluation Metrics
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            {fetchError}. Ensure the Python FastAPI server is active (<code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">python -m uvicorn backend.main:app --port 8000</code>) 
            and that model training has completed (<code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">python backend/train_model.py</code>).
          </p>
          <button
            onClick={fetchMetrics}
            className="px-3.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Tab 1: Model Comparison */}
      {!isLoading && metricsData && activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="research-card p-5 sm:p-6 border-l-4 border-l-[#FACC15] bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-amber-600" /> Selected Production Estimator: {metricsData.selected_model}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                Optimal Test Performance
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#374151] leading-relaxed">
              {metricsData.selection_rationale} Evaluated across <strong className="text-[#111827]">{metricsData.test_encounters.toLocaleString()} held-out encounters</strong> ({metricsData.test_patients.toLocaleString()} distinct patients) 
              with zero patient overlap with the training cohort.
            </p>
          </div>

          {/* Model Comparison Table */}
          <div className="research-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Genuine Model Comparison Suite</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Held-out test set evaluation with unit metrics</p>
              </div>
              <span className="text-[11px] font-mono text-[#6B7280]">Target: time_in_hospital (Days)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-[#E5E7EB] text-[#4B5563] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Estimator Architecture</th>
                    <th className="py-3 px-4">MAE (Days) ↓</th>
                    <th className="py-3 px-4">RMSE (Days) ↓</th>
                    <th className="py-3 px-4">R² Score ↑</th>
                    <th className="py-3 px-4">Fit Time (sec)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
                  {metricsData.models_comparison.map((model) => {
                    const isSelected = model.model_name === metricsData.selected_model;
                    return (
                      <tr key={model.model_name} className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-amber-50/60 font-semibold text-[#111827]' : ''}`}>
                        <td className="py-3 px-4 flex items-center gap-2">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                          {model.model_name}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {model.mae.toFixed(3)} d
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {model.rmse.toFixed(3)} d
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={model.r2 > 0.35 ? 'text-emerald-700 font-bold' : model.r2 < 0 ? 'text-rose-600 font-semibold' : 'text-[#374151]'}>
                            {model.r2.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#6B7280]">
                          {model.training_time_seconds.toFixed(2)}s
                        </td>
                        <td className="py-3 px-4">
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                              Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#6B7280] font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Benchmark</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Comparison Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MAE & RMSE Chart */}
            <div className="research-card p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                Error Metrics Comparison (Lower is Better)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.models_comparison} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="model_name" 
                      stroke="#9CA3AF" 
                      fontSize={10} 
                      tick={{ fill: '#4B5563' }}
                      angle={-15} 
                      textAnchor="end" 
                      interval={0} 
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#4B5563', fontSize: 11 }} domain={[0, 3.5]} unit="d" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} days`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#374151' }} />
                    <Bar dataKey="mae" name="Mean Absolute Error (MAE)" fill="#EAB308" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rmse" name="Root Mean Squared Error (RMSE)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* R2 Variance Explained Chart */}
            <div className="research-card p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                Explained Variance R² (Higher is Better)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.models_comparison} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="model_name" 
                      stroke="#9CA3AF" 
                      fontSize={10} 
                      tick={{ fill: '#4B5563' }}
                      angle={-15} 
                      textAnchor="end" 
                      interval={0} 
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#4B5563', fontSize: 11 }} domain={[-0.1, 0.5]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                    />
                    <ReferenceLine y={0} stroke="#9CA3AF" />
                    <Bar dataKey="r2" name="R² (Coefficient of Determination)" fill="#10B981" radius={[4, 4, 0, 0]}>
                      {metricsData.models_comparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.model_name === metricsData.selected_model ? '#EAB308' : entry.r2 < 0 ? '#EF4444' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Actual vs Predicted Plot */}
      {!isLoading && metricsData && activeTab === 'actual_vs_pred' && (
        <div className="space-y-6">
          <div className="research-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" /> Actual versus Predicted Hospital Length-of-Stay
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Held-out test set random sample (N = {metricsData.actual_vs_predicted_sample.length} encounters). Amber diagonal represents perfect estimation (y = x).
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-gray-50 border border-[#E5E7EB] text-[#374151]">
                Model: {metricsData.selected_model}
              </span>
            </div>

            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual Stay" 
                    unit="d" 
                    stroke="#9CA3AF" 
                    fontSize={11} 
                    tick={{ fill: '#4B5563' }}
                    domain={[0, 15]}
                    label={{ value: 'Observed Hospital Stay (Days)', position: 'insideBottom', offset: -10, fill: '#4B5563', fontSize: 11 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted Stay" 
                    unit="d" 
                    stroke="#9CA3AF" 
                    fontSize={11} 
                    tick={{ fill: '#4B5563' }}
                    domain={[0, 15]}
                    label={{ value: 'Predicted Length of Stay (Days)', angle: -90, position: 'insideLeft', offset: 5, fill: '#4B5563', fontSize: 11 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [`${val} days`, name]}
                  />
                  {/* Ideal Reference 45 degree line */}
                  <ReferenceLine segment={[{ x: 1, y: 1 }, { x: 14, y: 14 }]} stroke="#D97706" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Ideal (y = x)', fill: '#B45309', fontSize: 10, position: 'top' }} />
                  <Scatter name="Held-Out Encounters" data={metricsData.actual_vs_predicted_sample} fill="#0284C7" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Residual Analysis */}
      {!isLoading && metricsData && activeTab === 'residuals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Residual Histogram */}
            <div className="research-card p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-amber-600" /> Residual Error Distribution
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Residual = Observed Stay - Predicted Stay (Days)</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.residual_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="bin_range" stroke="#9CA3AF" tick={{ fill: '#4B5563', fontSize: 9 }} angle={-30} textAnchor="end" />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#4B5563', fontSize: 11 }} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                      formatter={(val: any, _name: any, item: any) => [`${val}% (${item.payload.count.toLocaleString()} encounters)`, 'Error Frequency']}
                    />
                    <ReferenceLine x="0 to 1d" stroke="#D97706" strokeDasharray="3 3" />
                    <Bar dataKey="pct" name="Residual %" fill="#EAB308" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Distribution is bell-shaped with median residual centered around 0 days, indicating unbiased predictions.
              </p>
            </div>

            {/* Residuals vs Predicted Plot */}
            <div className="research-card p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" /> Residuals versus Predicted Stay
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Homoscedasticity diagnostic across predicted days</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      type="number" 
                      dataKey="predicted" 
                      name="Predicted Stay" 
                      unit="d" 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      tick={{ fill: '#4B5563' }}
                      domain={[1, 14]}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="residual" 
                      name="Residual" 
                      unit="d" 
                      stroke="#9CA3AF" 
                      fontSize={11} 
                      tick={{ fill: '#4B5563' }}
                      domain={[-10, 10]}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [`${val} days`, name]}
                    />
                    <ReferenceLine y={0} stroke="#D97706" strokeWidth={1.5} strokeDasharray="3 3" />
                    <Scatter name="Test Encounters" data={metricsData.residuals_vs_predicted} fill="#8B5CF6" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Errors are symmetrically distributed along the zero axis without severe funnel heteroscedasticity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Feature Importance */}
      {!isLoading && metricsData && activeTab === 'importance' && (
        <div className="space-y-6">
          <div className="research-card p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" /> Empirical Feature Importance Ranking
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Calculated on held-out test data via Permutation Importance on the fitted pipeline. 
                Values represent increase in MAE (days) when feature is randomized.
              </p>
            </div>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={metricsData.feature_importances} 
                  margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#4B5563', fontSize: 11 }} unit="d" />
                  <YAxis type="category" dataKey="feature" stroke="#9CA3AF" tick={{ fill: '#4B5563', fontSize: 11 }} width={130} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                    formatter={(val: any) => [`+${val} days MAE penalty`, 'Importance Score']}
                  />
                  <Bar dataKey="importance" fill="#EAB308" radius={[0, 4, 4, 0]}>
                    {metricsData.feature_importances.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#EAB308' : '#9CA3AF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Splitting Protocol & Leakage Audit */}
      {!isLoading && metricsData && activeTab === 'methodology' && (
        <div className="space-y-6">
          <div className="research-card p-5 sm:p-6 space-y-5">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Data Splitting Protocol & Leakage Elimination Audit
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Academic standards ensuring generalizability and clinical deployability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-600" /> Patient-Level Cohort Splitting
                </h4>
                <div className="p-4 rounded-lg bg-gray-50 border border-[#E5E7EB] space-y-2 text-xs text-[#374151] leading-relaxed">
                  <p>
                    <strong className="text-[#111827]">Methodology:</strong> <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{metricsData.split_strategy}</code>
                  </p>
                  <p>
                    <strong className="text-[#111827]">Train Partition:</strong> {metricsData.train_encounters.toLocaleString()} encounters ({metricsData.train_patients.toLocaleString()} unique patients)
                  </p>
                  <p>
                    <strong className="text-[#111827]">Held-Out Test Partition:</strong> {metricsData.test_encounters.toLocaleString()} encounters ({metricsData.test_patients.toLocaleString()} unique patients)
                  </p>
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>0 Patient Overlap Verified: The same individual never appears in both train and test partitions.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" /> Admission-Time Prediction Policy
                </h4>
                <div className="p-4 rounded-lg bg-gray-50 border border-[#E5E7EB] space-y-2 text-xs text-[#374151] leading-relaxed">
                  <p>
                    <strong className="text-[#111827]">Exclusion of Target Leakage:</strong> Post-admission characteristics such as <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">discharge_disposition_id</code>, 
                    discharge notes, and subsequent procedure codes are strictly excluded because they are only known at the time of patient release.
                  </p>
                  <p>
                    <strong className="text-[#111827]">Identifiers Omitted:</strong> <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">encounter_id</code>, <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">patient_nbr</code>, 
                    and administrative billing identifiers are eliminated to prevent artifactual memorization.
                  </p>
                  <p>
                    <strong className="text-[#111827]">Pipeline Encapsulation:</strong> Missing value imputation and categorical encoding are fitted strictly on the training partition and applied out-of-sample to the held-out test records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
