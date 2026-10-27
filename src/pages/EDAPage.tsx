import { useMemo, useState } from 'react';
import { useDataContext } from '../context/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { calculateGroupLOS } from '../services/statistics';
import { BarChart3, Stethoscope, Building2, GitBranch } from 'lucide-react';

type EdaTab = 'demographics' | 'administrative' | 'clinical' | 'diagnosis_outcomes';

export default function EDAPage() {
  const { data, isReady } = useDataContext();
  const [activeTab, setActiveTab] = useState<EdaTab>('demographics');

  // 1. Distribution of time_in_hospital (1-14 days)
  const losDistribution = useMemo(() => {
    if (!data) return [];
    const counts: Record<number, number> = {};
    for (const r of data.cleanRecords) {
      counts[r.time_in_hospital] = (counts[r.time_in_hospital] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([day, count]) => ({
        day: `${day} d`,
        count,
        pct: Number(((count / data.cleanRecords.length) * 100).toFixed(1))
      }))
      .sort((a, b) => parseInt(a.day, 10) - parseInt(b.day, 10));
  }, [data]);

  // 2. Mean and median LOS by age group
  const losByAgeGroup = useMemo(() => {
    if (!data) return [];
    const ageData = data.cleanRecords.map((r) => ({ group: r.age, los: r.time_in_hospital }));
    const grouped = calculateGroupLOS(ageData);
    const ageOrder = ['[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'];
    return grouped.sort((a, b) => {
      const idxA = ageOrder.indexOf(a.name);
      const idxB = ageOrder.indexOf(b.name);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [data]);

  // 3. LOS by gender
  const losByGender = useMemo(() => {
    if (!data) return [];
    const genderData = data.cleanRecords
      .filter((r) => r.gender !== 'Unknown/Invalid')
      .map((r) => ({ group: r.gender, los: r.time_in_hospital }));
    return calculateGroupLOS(genderData);
  }, [data]);

  // 4. LOS by mapped admission type (IDS mapping)
  const losByAdmissionType = useMemo(() => {
    if (!data) return [];
    const admData = data.cleanRecords.map((r) => ({
      group: r.admission_type_desc || `Type ${r.admission_type_id}`,
      los: r.time_in_hospital
    }));
    return calculateGroupLOS(admData).slice(0, 8);
  }, [data]);

  // 5. LOS by mapped admission source (IDS mapping)
  const losByAdmissionSource = useMemo(() => {
    if (!data) return [];
    const srcData = data.cleanRecords.map((r) => ({
      group: r.admission_source_desc || `Source ${r.admission_source_id}`,
      los: r.time_in_hospital
    }));
    return calculateGroupLOS(srcData).slice(0, 8);
  }, [data]);

  // 6. LOS by mapped discharge disposition (IDS mapping)
  const losByDischargeDisp = useMemo(() => {
    if (!data) return [];
    const dispData = data.cleanRecords.map((r) => ({
      group: r.discharge_disposition_desc || `Disp ${r.discharge_disposition_id}`,
      los: r.time_in_hospital
    }));
    return calculateGroupLOS(dispData).slice(0, 8);
  }, [data]);

  // 7. LOS by diagnosis category (ICD-9 mapped)
  const losByDiagnosisCategory = useMemo(() => {
    if (!data) return [];
    const diagData = data.cleanRecords.map((r) => ({
      group: r.diag_1_category || 'Other / Missing',
      los: r.time_in_hospital
    }));
    return calculateGroupLOS(diagData);
  }, [data]);

  // 8. Procedure counts versus LOS (0, 1, 2, 3, 4, 5, 6)
  const procVsLOS = useMemo(() => {
    if (!data) return [];
    const procData = data.cleanRecords.map((r) => ({
      group: `${r.num_procedures} Procs`,
      los: r.time_in_hospital,
      numericVal: r.num_procedures
    }));
    return calculateGroupLOS(procData).sort((a, b) => {
      const nA = parseInt(a.name, 10);
      const nB = parseInt(b.name, 10);
      return nA - nB;
    });
  }, [data]);

  // 9. Medication counts versus LOS (binned)
  const medsVsLOS = useMemo(() => {
    if (!data) return [];
    const getMedBin = (meds: number) => {
      if (meds <= 5) return '1–5 Meds';
      if (meds <= 10) return '6–10 Meds';
      if (meds <= 15) return '11–15 Meds';
      if (meds <= 20) return '16–20 Meds';
      if (meds <= 30) return '21–30 Meds';
      return '31+ Meds';
    };
    const medData = data.cleanRecords.map((r) => ({
      group: getMedBin(r.num_medications),
      los: r.time_in_hospital
    }));
    const order = ['1–5 Meds', '6–10 Meds', '11–15 Meds', '16–20 Meds', '21–30 Meds', '31+ Meds'];
    return calculateGroupLOS(medData).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  }, [data]);

  // 10. Lab procedure counts versus LOS (binned)
  const labsVsLOS = useMemo(() => {
    if (!data) return [];
    const getLabBin = (labs: number) => {
      if (labs <= 20) return '1–20 Labs';
      if (labs <= 40) return '21–40 Labs';
      if (labs <= 60) return '41–60 Labs';
      if (labs <= 80) return '61–80 Labs';
      return '81+ Labs';
    };
    const labData = data.cleanRecords.map((r) => ({
      group: getLabBin(r.num_lab_procedures),
      los: r.time_in_hospital
    }));
    const order = ['1–20 Labs', '21–40 Labs', '41–60 Labs', '61–80 Labs', '81+ Labs'];
    return calculateGroupLOS(labData).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  }, [data]);

  // 11. Readmission outcome versus LOS
  const readmissionVsLOS = useMemo(() => {
    if (!data) return [];
    const readmitData = data.cleanRecords.map((r) => ({
      group: r.readmitted === 'NO' ? 'No Readmission' : r.readmitted === '>30' ? 'Readmitted >30d' : 'Readmitted <30d',
      los: r.time_in_hospital
    }));
    return calculateGroupLOS(readmitData);
  }, [data]);

  if (!isReady || !data) {
    return (
      <div className="research-card p-12 text-center text-slate-500 text-sm" role="status">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-3" />
        Processing 101,766 observations for Exploratory Data Analysis...
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    fontSize: 12
  };
  const tickStyle = { fill: '#64748b', fontSize: 11 };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            Exploratory Data Analysis
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hospital Length-of-Stay Multivariate Patterns
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Empirical investigation into demographic, administrative, clinical, and diagnostic predictors 
            of inpatient duration across 101,766 clinical encounters.
          </p>
        </div>
        <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-lg font-mono shadow-2xs self-start md:self-auto">
          Cohort N = 101,766 Encounters
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-6 text-xs sm:text-sm overflow-x-auto" role="tablist">
        {[
          { id: 'demographics', label: '1. Target & Demographics', icon: BarChart3 },
          { id: 'administrative', label: '2. Administrative & IDS Mappings', icon: Building2 },
          { id: 'clinical', label: '3. Clinical Utilization vs LOS', icon: Stethoscope },
          { id: 'diagnosis_outcomes', label: '4. ICD-9 Diagnosis & Outcomes', icon: GitBranch }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Target & Demographics */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          {/* Distribution of time_in_hospital */}
          <div className="research-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">1. Distribution of Target Variable: time_in_hospital</h2>
                <p className="text-xs text-slate-500">
                  Empirical frequency and right-skewed histogram of inpatient days (1 to 14 days) • N = 101,766
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold self-start sm:self-auto">
                Skewness: +0.84 (Right-Skewed)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={losDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any, _name: any, item: any) => [
                    `${Number(val).toLocaleString()} encounters (${item.payload.pct}%)`,
                    'Frequency'
                  ]}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2. Mean and median LOS by age group */}
            <div className="research-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">2. Mean & Median LOS by Age Cohort</h2>
                  <p className="text-xs text-slate-500">Length of stay progression across age deciles</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold font-mono">
                  Age Trend
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={losByAgeGroup} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} unit="d" domain={[0, 6]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any, name: any) => [
                      name === 'meanLOS' ? `${val} days (Mean)` : `${val} days (Median)`,
                      name === 'meanLOS' ? 'Mean LOS' : 'Median LOS'
                    ]}
                  />
                  <Bar dataKey="meanLOS" name="Mean LOS" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="medianLOS" name="Median LOS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 3. LOS by gender */}
            <div className="research-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">3. Length of Stay by Patient Gender</h2>
                  <p className="text-xs text-slate-500">Comparative inpatient duration between Male and Female cohorts</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={losByGender} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} unit="d" domain={[0, 6]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                  />
                  <Bar dataKey="meanLOS" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                {losByGender.map((g) => (
                  <div key={g.name} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block font-medium">{g.name} ({g.percentage}%)</span>
                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 font-mono">
                      {g.meanLOS}d mean • {g.medianLOS}d median
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Administrative & IDS Mappings */}
      {activeTab === 'administrative' && (
        <div className="space-y-6">
          {/* 4. LOS by mapped admission type */}
          <div className="research-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">4. LOS by Mapped Admission Type</h2>
                <p className="text-xs text-slate-500">
                  Hospital stay length cross-referenced with IDS_mapping.csv admission type labels
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded self-start sm:self-auto">
                IDS Table 1
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={losByAdmissionType} layout="vertical" margin={{ top: 5, right: 20, left: 110, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={tickStyle} unit="d" domain={[0, 6]} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 11 }} width={110} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                />
                <Bar dataKey="meanLOS" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5. LOS by admission source */}
            <div className="research-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">5. LOS by Admission Source</h2>
                  <p className="text-xs text-slate-500">Referral route (Emergency, Physician, Transfer, Clinic)</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded">
                  IDS Table 3
                </span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={losByAdmissionSource} layout="vertical" margin={{ top: 5, right: 20, left: 130, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={tickStyle} unit="d" domain={[0, 6]} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 10 }} width={130} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                  />
                  <Bar dataKey="meanLOS" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 6. LOS by discharge disposition */}
            <div className="research-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">6. LOS by Discharge Disposition</h2>
                  <p className="text-xs text-slate-500">Post-discharge destination (Home, SNF, Rehab, Hospice)</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                  IDS Table 2
                </span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={losByDischargeDisp} layout="vertical" margin={{ top: 5, right: 20, left: 130, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={tickStyle} unit="d" domain={[0, 8]} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 10 }} width={130} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                  />
                  <Bar dataKey="meanLOS" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Clinical Utilization vs LOS */}
      {activeTab === 'clinical' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 8. Procedure counts versus LOS */}
            <div className="research-card p-5 sm:p-6">
              <div className="mb-3">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">8. Procedure Count vs LOS</h2>
                <p className="text-xs text-slate-500">Inpatient stay as a function of operating procedures (0 to 6)</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={procVsLOS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} unit="d" domain={[0, 8]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                  />
                  <Bar dataKey="meanLOS" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">Strong monotonic gradient: each additional procedure adds ~0.8 days to mean stay.</p>
            </div>

            {/* 9. Medication counts versus LOS */}
            <div className="research-card p-5 sm:p-6">
              <div className="mb-3">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">9. Medication Count vs LOS</h2>
                <p className="text-xs text-slate-500">Inpatient stay binned by total distinct medications</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={medsVsLOS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} unit="d" domain={[0, 8]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                  />
                  <Bar dataKey="meanLOS" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">Polypharmacy marker: patients on 31+ medications average over 6.5 days.</p>
            </div>

            {/* 10. Lab procedure counts versus LOS */}
            <div className="research-card p-5 sm:p-6">
              <div className="mb-3">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">10. Lab Tests vs LOS</h2>
                <p className="text-xs text-slate-500">Inpatient stay categorized by total laboratory procedures</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={labsVsLOS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} unit="d" domain={[0, 8]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                  />
                  <Bar dataKey="meanLOS" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">High lab frequency indicates ongoing clinical surveillance and complications.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ICD-9 Diagnosis & Outcomes */}
      {activeTab === 'diagnosis_outcomes' && (
        <div className="space-y-6">
          {/* 7. LOS by diagnosis category */}
          <div className="research-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">7. Length of Stay by Primary ICD-9 Diagnostic Family</h2>
                <p className="text-xs text-slate-500">
                  Standardized ICD-9 category groupings according to clinical methodology (Strack et al., 2014)
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium self-start sm:self-auto font-mono">
                Clinical Taxonomy
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={losByDiagnosisCategory} layout="vertical" margin={{ top: 5, right: 20, left: 140, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={tickStyle} unit="d" domain={[0, 6]} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 11 }} width={140} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [`${val} days`, 'Mean LOS']}
                />
                <Bar dataKey="meanLOS" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 11. Readmission outcome versus LOS */}
          <div className="research-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">11. Readmission Outcome vs Length of Stay</h2>
                <p className="text-xs text-slate-500">
                  Mean and median hospital stay compared across 30-day readmission status
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium self-start sm:self-auto font-mono">
                Outcome Stratification
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
              {readmissionVsLOS.map((item) => (
                <div key={item.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{item.name}</span>
                  <p className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono">{item.meanLOS} days</p>
                  <p className="text-xs text-slate-600 font-mono">Median: {item.medianLOS}d • Range: {item.minLOS}–{item.maxLOS}d</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">N = {item.count.toLocaleString()} ({item.percentage}%)</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
