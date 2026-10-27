# Hospital Length of Stay (LOS) Clinical Research & Prediction System

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An end-to-end clinical data science platform and machine learning prediction system designed to analyze and predict **Hospital Length of Stay (LOS)** for inpatient diabetic encounters. Built on the landmark **UCI Diabetes 130-US Hospitals (1999–2008)** dataset containing **101,766 patient encounters** across 130 United States hospitals.

The platform pairs a **sleek dark navigation sidebar (`#090909`)** with a **minimalist, high-clarity white clinical research dashboard (`#FFFFFF`)**, complete with interactive exploratory charts, statistical hypothesis testing, live dataset filtering, an end-to-end ML training pipeline, and a real-time clinical prediction engine.

---

## 📸 Key Features & Dashboard Modules

The platform is organized into 8 interconnected modules:

1. **Executive Overview (`/`)**
   - High-level cohort KPIs: total encounters (101,766), average LOS (4.40 days), 30-day readmission rate (11.16%), high-acuity admission share (52.55%).
   - Distribution of length of stay across inpatient days.
   - Clinical encounters segmented by age brackets and admission sources.
   - Dynamic cohort filtering across age, gender, race, admission type, and A1C results.

2. **Dataset Explorer (`/explorer`)**
   - Live paginated data grid streaming real patient records with fast search, column sorting, and custom filtering.
   - Patient encounter drawer with detailed breakdown of medications (insulin, metformin, sulfonylureas), lab tests, and ICD-9 diagnosis codes.
   - Comprehensive column-level data dictionary and summary distributions.

3. **Data Preparation Pipeline (`/preparation`)**
   - Transparent documentation of the data cleaning and preprocessing pipeline.
   - Handling of missing values and sentinel indicators (`?`).
   - Grouping and classification of ICD-9 diagnoses (Circulatory, Respiratory, Digestive, Diabetes, Injury, Musculoskeletal, Neoplasms, Genitourinary).
   - Encoding strategies for categorical features, medications, and admission identification mappings.

4. **Exploratory Data Analysis (EDA) (`/eda`)**
   - Interactive Recharts visualizations examining patient factors influencing LOS.
   - Number of lab procedures, medications, and diagnoses vs. hospital stay duration.
   - Medication adjustments and insulin therapy impact on discharge timelines.
   - Multi-variate demographic distributions and variance across admission types.

5. **Statistical Investigation (`/statistics`)**
   - Hypothesis testing across clinical cohorts:
     - **One-Way ANOVA**: Comparing LOS variance across admission urgency categories.
     - **Independent Two-Sample T-Tests**: Evaluating LOS differences between patients with vs. without insulin therapy.
     - **Chi-Square Tests of Independence**: Evaluating relationships between HbA1c testing results and 30-day readmissions.
   - Formal null/alternative hypotheses, test statistics ($F$, $t$, $\chi^2$), $p$-values, effect sizes (Cohen's $d$, $\eta^2$), and clinical interpretations.

6. **Real-Time LOS Prediction Engine (`/prediction`)**
   - Direct connection to trained Scikit-Learn regression pipelines via FastAPI.
   - Clinical admission form: Age category, admission urgency, source, primary ICD-9 diagnosis, number of lab procedures, procedures, medications, diagnoses, and glycemic indicators.
   - Real-time LOS forecast with predicted days, acuity risk stratification (Low / Moderate / High / Critical), and feature influence factors.
   - Zero hardcoded values — all predictions are calculated dynamically by the ML model.

7. **Model Evaluation & Diagnostics (`/evaluation`)**
   - Rigorous benchmarking of 4 supervised learning regression algorithms:
     - **Gradient Boosting Regressor**
     - **Random Forest Regressor**
     - **Ridge Regression**
     - **Linear Regression**
   - Comprehensive performance metrics: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and $R^2$ Score.
   - Actual-vs-Predicted calibration curves, residual distribution histograms, and feature importance rankings.

8. **About the Research (`/about`)**
   - Full scientific documentation, data citations, mathematical definitions, and architectural schematics.

---

## 🎨 UI & Design System

The interface adheres to an intentional, accessible clinical design system:
- **Navigation Sidebar**: Dark near-black (`#090909`), `#262626` borders, crisp `#FFFFFF` primary labels, `#A3A3A3` secondary text, and active indicator highlights in warm yellow (`#FACC15`) with charcoal backing (`#171717`).
- **Main Dashboard**: Clean, minimal pure white (`#FFFFFF`) surface, subtle `#E5E7EB` borders, `#111827` primary headings, `#374151` readable body text, and accessible interactive accents.
- **Charts & Data Tables**: Optimized Recharts color palettes with high-contrast tooltips, subtle gridlines, and fully responsive layouts.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) + Custom Design Tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts 3](https://recharts.org/)
- **CSV Parsing & Streaming**: [PapaParse](https://www.papaparse.com/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)

### Backend & Machine Learning
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Data Science**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/), [SciPy](https://scipy.org/)
- **Machine Learning**: [Scikit-Learn](https://scikit-learn.org/) (Gradient Boosting, Random Forest, Ridge Regression, Preprocessing Pipelines)
- **Model Serialization**: [Joblib](https://joblib.readthedocs.io/)

---

## 📂 Project Structure

```
hospital_length_of_stay/
├── backend/
│   ├── main.py                     # FastAPI application endpoints (/api/predict, /api/model/metrics)
│   ├── train_model.py              # ML model training and evaluation script
│   └── models/
│       ├── best_model.joblib       # Serialized trained Scikit-Learn model pipeline
│       └── evaluation_results.json # Precomputed evaluation metrics and benchmarks
├── public/
│   └── data/
│       ├── diabetic_data.csv       # Clinical encounters dataset (101,766 rows)
│       └── IDS_mapping.csv         # Admission, discharge, and admission source code mappings
├── src/
│   ├── assets/                     # Static icons and assets
│   ├── components/
│   │   ├── AppLayout.tsx           # Global shell with dark sidebar and white main surface
│   │   ├── DashboardFilterBar.tsx  # Dynamic multi-parameter filtering bar
│   │   ├── LoadingScreen.tsx       # Polished dataset loading & caching view
│   │   └── Sidebar.tsx             # Persistent dark navigation sidebar
│   ├── context/
│   │   └── DataContext.tsx         # Global React context for dataset state and caching
│   ├── pages/
│   │   ├── AboutPage.tsx           # Research methodology and references
│   │   ├── DataPreparationPage.tsx # Data cleaning & engineering documentation
│   │   ├── DatasetExplorerPage.tsx # Paginated data grid with encounter drawer
│   │   ├── EDAPage.tsx             # Interactive exploratory data analysis charts
│   │   ├── LOSPredictionPage.tsx   # Live prediction form connected to ML backend
│   │   ├── ModelEvaluationPage.tsx # Comparison metrics, residuals & feature importance
│   │   ├── OverviewPage.tsx        # High-level cohort KPIs and distributions
│   │   └── StatisticsPage.tsx      # Formal hypothesis testing & ANOVA
│   ├── services/
│   │   ├── datasetLoader.ts        # Client-side streaming and parsing of dataset
│   │   ├── dataTransformer.ts      # Clinical grouping & encoding transformations
│   │   ├── dataValidator.ts        # Data integrity and schema verification
│   │   ├── exportService.ts        # CSV/JSON dataset export utilities
│   │   ├── idMappingParser.ts      # ICD & admission code translation
│   │   └── statistics.ts           # Client-side statistical calculation engine
│   ├── types/
│   │   ├── dataset.ts              # Core TypeScript interfaces for clinical encounters
│   │   └── navigation.ts           # Navigation route typings
│   ├── App.tsx                     # Route definitions
│   ├── index.css                   # Custom clinical styling tokens & scrollbars
│   └── main.tsx                    # Application entrypoint
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.9 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/varshini2006-cse/Hospital_Length_of_Stay.git
cd Hospital_Length_of_Stay
```

### 2. Frontend Setup
Install frontend dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will start at `http://localhost:5173` (or `http://localhost:5174` if port 5173 is in use).

### 3. Backend & ML Service Setup
Create and activate a virtual environment (optional but recommended):
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:
```bash
pip install fastapi uvicorn scikit-learn pandas numpy joblib
```

Start the FastAPI backend server:
```bash
python -m uvicorn backend.main:app --port 8000 --reload
```
The API server will run at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

*(Optional)* To retrain the machine learning models and recalculate evaluation benchmarks:
```bash
python backend/train_model.py
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and ML model loaded status |
| `POST` | `/api/predict` | Computes predicted LOS (days) and risk acuity for patient parameters |
| `GET` | `/api/model/metrics` | Returns evaluation metrics (MAE, RMSE, $R^2$) across trained models |
| `GET` | `/api/model/features` | Returns ranked feature importance scores from the best model |

### Example Prediction Request
```bash
curl -X POST "http://127.0.0.1:8000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "age": "[60-70)",
    "admission_type_id": 1,
    "admission_source_id": 7,
    "time_in_hospital": 0,
    "num_lab_procedures": 45,
    "num_procedures": 2,
    "num_medications": 18,
    "number_diagnoses": 9,
    "diag_1_group": "Circulatory",
    "A1Cresult": "None",
    "insulin": "Up",
    "change": "Ch",
    "diabetesMed": "Yes"
  }'
```

---

## 🔬 Dataset Acknowledgments

The dataset used in this research was originally submitted to the **UC Irvine Machine Learning Repository**:
- **Dataset**: *Diabetes 130-US hospitals for years 1999–2008*
- **Primary Authors**: Beata Strack, Jonathan P. DeShazo, Chris Gennings, Juan L. Olmo, Sebastian Ventura, Kenneth J. Cios, and John N. Clore.
- **Citation**: *"Impact of HbA1c Measurement on Hospital Readmission Rates: Analysis of 70,000 Clinical Database Patient Records,"* BioMed Research International, vol. 2014, Article ID 781670.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
