import { 
  BookOpen, FileText, Database, Shield, Wrench, AlertCircle, 
  ExternalLink, CheckCircle2, Bookmark, GraduationCap
} from 'lucide-react';

const CITATIONS = [
  {
    id: 1,
    ref: 'Strack et al. (2014)',
    title: 'Impact of HbA1c Measurement on Hospital Readmission Rates: Analysis of 70,000 Clinical Database Patient Records',
    journal: 'BioMed Research International, Vol. 2014, Article ID 781670',
    year: 2014,
    link: 'https://doi.org/10.1155/2014/781670'
  },
  {
    id: 2,
    ref: 'UCI Machine Learning Repository',
    title: 'Diabetes 130-US Hospitals for Years 1999-2008 Data Set',
    journal: 'Center for Machine Learning and Intelligent Systems, University of California, Irvine',
    year: 2014,
    link: 'https://archive.ics.uci.edu/dataset/296/diabetes+130-us+hospitals+for+years+1999-2008'
  }
];

export default function AboutPage() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          Academic Monograph & Methodology
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          An Empirical Investigation Into Hospital Length-of-Stay Predictors
        </h1>
        <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
          Using Advanced Data Manipulation Techniques
        </p>
      </div>

      {/* College Evaluation Notice */}
      <div className="research-card p-4 sm:p-5 bg-gradient-to-r from-blue-50/60 to-slate-50 border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-blue-700 flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">Academic Capstone Evaluation Specification</span>
            <p className="text-slate-600">
              Developed as an empirical Data Science investigation utilizing the historical 101,766-encounter Diabetes 130-US Hospitals cohort (1999–2008).
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 flex-shrink-0">
          Synthetic-Free Protocol
        </span>
      </div>

      {/* Abstract Section */}
      <div className="research-card p-5 sm:p-6 border-l-4 border-l-blue-600 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" /> Abstract
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
          Hospital Length of Stay (LOS) serves as a paramount benchmark for clinical resource allocation, inpatient healthcare expenditure, 
          and patient recovery efficiency. This empirical investigation evaluates determinants of inpatient duration among diabetic patients 
          utilizing the historical Diabetes 130-US Hospitals dataset spanning 1999 through 2008 (N = 101,766 clinical encounters). 
          By applying advanced client-side data transformation, relational dictionary mapping, and parametric hypothesis testing, 
          we isolate key drivers of extended stays—specifically diagnostic testing intensity, surgical intervention volume, 
          and clinical comorbidity burden. In strict adherence to open scientific research standards, all analyses are derived directly 
          from the real dataset without synthetic data injection or masked data deletion.
        </p>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="research-card p-5 sm:p-6 space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" aria-hidden="true" /> Problem Statement
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Inpatient hospitalization costs represent over 30% of total healthcare expenditures in the United States. 
            Diabetic patients experience high rates of prolonged hospital stays, secondary complications, and subsequent readmissions. 
            However, clinical indicators determining whether an admission terminates in 1–3 days versus prolonged stays (&gt;7 days) 
            are frequently conflated by non-random missingness, high categorical dimensionality, and relational code obscurities. 
            Standardizing these variables without fabricating synthetic records is essential for trustworthy data science modeling.
          </p>
        </div>

        <div className="research-card p-5 sm:p-6 space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" aria-hidden="true" /> Research Objectives
          </h2>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li>Extract, parse, and validate 101,766 verified hospital encounter records and relational mapping dictionaries.</li>
            <li>Quantify empirical distributions of the primary target variable (<code className="font-mono text-slate-800">time_in_hospital</code>).</li>
            <li>Evaluate formal statistical hypotheses regarding age, admission route, laboratory intensity, and readmission risk.</li>
            <li>Standardize ICD-9 clinical diagnostic categories and multi-table relational foreign keys without data loss.</li>
            <li>Establish an uncompromised predictive interface separated from server-side inference engines.</li>
          </ul>
        </div>
      </div>

      {/* Primary Research Questions */}
      <div className="research-card p-5 sm:p-6 space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Primary Research Questions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-700 block">RQ 1: Demographic Disparities</span>
            <p className="text-slate-600 text-xs">Does inpatient length of stay systematically correlate with age bracket progression or biological sex across inpatient encounters?</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-teal-700 block">RQ 2: Diagnostic Intensity</span>
            <p className="text-slate-600 text-xs">To what extent does laboratory procedure frequency reflect patient acuity versus accumulated stay duration?</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-700 block">RQ 3: Admission Route Impact</span>
            <p className="text-slate-600 text-xs">How substantially do emergency and trauma presentations diverge from planned elective admissions regarding inpatient length?</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-amber-700 block">RQ 4: Readmission Outcome Link</span>
            <p className="text-slate-600 text-xs">Are index hospital stays longer for patients who suffer early (within 30 days) unplanned hospital readmissions?</p>
          </div>
        </div>
      </div>

      {/* Dataset Description & Provenance */}
      <div className="research-card p-5 sm:p-6 space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" aria-hidden="true" /> Dataset Description & Terms of Use
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            The primary empirical dataset utilized is the <strong>Diabetes 130-US Hospitals dataset (1999–2008)</strong>, 
            originally contributed to the UCI Machine Learning Repository by Strack et al. (2014). 
            The cohort encompasses 10 years of clinical encounter records from 130 hospitals across the United States.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-sans block">Observations</span>
              <strong className="text-slate-900 text-sm">101,766</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-sans block">Raw Columns</span>
              <strong className="text-slate-900 text-sm">50 features</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-sans block">Cohort Timespan</span>
              <strong className="text-slate-900 text-sm">1999–2008</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-sans block">Dataset License</span>
              <strong className="text-slate-900 text-sm">CC BY 4.0</strong>
            </div>
          </div>
          <p className="pt-2 text-xs">
            <strong>Applicable Terms of Use:</strong> This dataset is distributed under the Creative Commons Attribution 4.0 International license. 
            Users are permitted to share and adapt the material provided appropriate attribution is credited to Strack et al. (2014).
          </p>
        </div>
      </div>

      {/* Methodology & Computational Architecture */}
      <div className="research-card p-5 sm:p-6 space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-teal-600" aria-hidden="true" /> Methodology & Computational Tools
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            The analytical architecture processes the complete 19.16 MB dataset directly within the browser runtime using stream-chunked Web API pipelines:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-1 text-xs sm:text-sm">Frontend Engineering</strong>
              <p className="text-slate-500 text-xs">React 19, TypeScript, Vite, Tailwind CSS with custom responsive analytics layout.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-1 text-xs sm:text-sm">Streaming CSV Ingestion</strong>
              <p className="text-slate-500 text-xs">PapaParse with chunked memory streaming to parse 101,766 rows without UI thread lockup.</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-1 text-xs sm:text-sm">Statistical Visualization</strong>
              <p className="text-slate-500 text-xs">Recharts for responsive SVG visualization, coupled with custom Welch's t-test and ANOVA engine.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Limitations & Ethical Considerations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="research-card p-5 sm:p-6 space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" aria-hidden="true" /> Study Limitations
          </h2>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li><strong>Severe Missingness in Weight:</strong> Over 96.9% of encounters lack documented body weight measurements, precluding BMI analysis.</li>
            <li><strong>Historical EMR Period:</strong> Data encompasses 1999–2008; pharmacological shifts over the subsequent decade are not represented.</li>
            <li><strong>Repeat Admission Clustering:</strong> 23.8% of patients account for multiple admissions; encounter independence must be treated with caution.</li>
            <li><strong>Coarse Age Stratification:</strong> Age is recorded in 10-year deciles rather than continuous exact years.</li>
          </ul>
        </div>

        <div className="research-card p-5 sm:p-6 space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Ethical Considerations
          </h2>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li><strong>De-Identification (HIPAA):</strong> Patient and encounter IDs are synthetic identifiers; no Protected Health Information (PHI) is exposed.</li>
            <li><strong>Fairness in Algorithmic Scoring:</strong> Predictors such as race and payer code are excluded from clinical scoring to avoid biased allocation.</li>
            <li><strong>Separation of Predictive Claims:</strong> Strict transparency prevents presenting unverified heuristics as certified medical models.</li>
            <li><strong>Open Reproducibility:</strong> Data processing rules and math formulas are fully open-source and deterministic.</li>
          </ul>
        </div>
      </div>

      {/* Citations & References */}
      <div className="research-card p-5 sm:p-6 space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-slate-900">Academic Citations & Literature References</h2>
        <div className="space-y-3 text-xs">
          {CITATIONS.map((c) => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">{c.ref}: {c.title}</span>
                <span className="text-slate-500 italic block">{c.journal} ({c.year})</span>
              </div>
              <a
                href={c.link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold flex-shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 rounded p-1"
                aria-label={`Open DOI link for ${c.ref}`}
              >
                DOI <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
