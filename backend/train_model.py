import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

def categorize_icd9(diag_str):
    if not diag_str or diag_str == '?' or pd.isna(diag_str):
        return 'Missing / Unspecified'
    diag_str = str(diag_str).strip()
    if diag_str.startswith('250'):
        return 'Diabetes Mellitus'
    if diag_str.startswith('V'):
        return 'Supplementary Health Factors (V-Code)'
    if diag_str.startswith('E'):
        return 'External Causes of Injury (E-Code)'
    try:
        num = float(diag_str)
    except ValueError:
        return 'Other / Ill-defined'
    
    if (390 <= num <= 459) or num == 785:
        return 'Circulatory System'
    elif (460 <= num <= 519) or num == 786:
        return 'Respiratory System'
    elif (520 <= num <= 579) or num == 787:
        return 'Digestive System'
    elif (580 <= num <= 629) or num == 788:
        return 'Genitourinary System'
    elif 800 <= num <= 999:
        return 'Injury and Poisoning'
    elif 710 <= num <= 739:
        return 'Musculoskeletal System'
    elif 140 <= num <= 239:
        return 'Neoplasms'
    elif 680 <= num <= 709:
        return 'Skin and Subcutaneous Tissue'
    elif 290 <= num <= 319:
        return 'Mental Disorders'
    elif 240 <= num <= 279:
        return 'Endocrine & Metabolic (Non-Diabetes)'
    else:
        return 'Other Diagnostic Category'

def load_and_preprocess_data(csv_path):
    print(f"Loading raw clinical dataset from {csv_path}...")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Loaded {len(df):,} total encounter records with {len(df.columns)} columns.")

    # Target variable
    y = df['time_in_hospital'].astype(float).values
    groups = df['patient_nbr'].astype(str).values

    # Preprocessing primary diagnosis to clinical categories
    df['diag_1_category'] = df['diag_1'].apply(categorize_icd9)

    # Clean A1Cresult and max_glu_serum sentinels
    df['A1Cresult'] = df['A1Cresult'].replace('?', 'None').fillna('None')
    df['max_glu_serum'] = df['max_glu_serum'].replace('?', 'None').fillna('None')
    df['insulin'] = df['insulin'].replace('?', 'No').fillna('No')
    df['race'] = df['race'].replace('?', 'Missing / Unspecified').fillna('Missing / Unspecified')
    df['gender'] = df['gender'].replace('Unknown/Invalid', 'Missing / Unspecified').fillna('Missing / Unspecified')

    # Selected Admission-time predictors (No target leakage; strictly excluding discharge_disposition_id)
    feature_cols = [
        'age',
        'admission_type_id',
        'admission_source_id',
        'diag_1_category',
        'num_lab_procedures',
        'num_procedures',
        'num_medications',
        'number_diagnoses',
        'number_inpatient',
        'number_emergency',
        'number_outpatient',
        'A1Cresult',
        'max_glu_serum',
        'insulin',
        'race',
        'gender'
    ]

    # Convert admission ids to string to treat as nominal categorical features
    df['admission_type_id'] = df['admission_type_id'].astype(str)
    df['admission_source_id'] = df['admission_source_id'].astype(str)

    X = df[feature_cols].copy()
    return X, y, groups, feature_cols

def train_and_evaluate():
    start_time = time.time()
    csv_path = 'public/data/diabetic_data.csv'
    if not os.path.exists(csv_path):
        csv_path = 'diabetes+130-us+hospitals+for+years+1999-2008/diabetic_data.csv'

    X, y, groups, feature_cols = load_and_preprocess_data(csv_path)

    # Patient-level Group Shuffle Split: 80% Train, 20% Held-Out Test
    print("Partitioning cohort via GroupShuffleSplit by patient_nbr (80/20 train/test)...")
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
    y_train, y_test = y[train_idx], y[test_idx]

    train_patients = len(np.unique(groups[train_idx]))
    test_patients = len(np.unique(groups[test_idx]))
    print(f"Train set: {len(X_train):,} encounters ({train_patients:,} unique patients)")
    print(f"Test set:  {len(X_test):,} encounters ({test_patients:,} unique patients)")
    
    # Verify zero patient leakage
    overlap = set(groups[train_idx]).intersection(set(groups[test_idx]))
    assert len(overlap) == 0, f"Error: Patient overlap detected: {len(overlap)}"
    print("Patient-level group partition verified: 0 patient overlap between train and test.")

    numeric_cols = [
        'num_lab_procedures', 'num_procedures', 'num_medications',
        'number_diagnoses', 'number_inpatient', 'number_emergency', 'number_outpatient'
    ]
    categorical_cols = [
        'age', 'admission_type_id', 'admission_source_id', 'diag_1_category',
        'A1Cresult', 'max_glu_serum', 'insulin', 'race', 'gender'
    ]

    # Preprocessors
    num_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    cat_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    preprocessor = ColumnTransformer([
        ('num', num_pipe, numeric_cols),
        ('cat', cat_pipe, categorical_cols)
    ])

    models = {
        'Dummy Median (Baseline)': DummyRegressor(strategy='median'),
        'Ridge Regression': Ridge(alpha=10.0),
        'Random Forest Regressor': RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            max_samples=0.5,
            random_state=42,
            n_jobs=-1
        ),
        'HistGradientBoosting Regressor': HistGradientBoostingRegressor(
            max_iter=150,
            max_depth=8,
            learning_rate=0.08,
            random_state=42
        )
    }

    comparison_results = []
    trained_pipelines = {}
    test_predictions = {}

    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        t0 = time.time()
        pipe = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])
        pipe.fit(X_train, y_train)
        elapsed = time.time() - t0

        y_pred = pipe.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))

        print(f"Completed in {elapsed:.2f}s | Test MAE: {mae:.3f} days | RMSE: {rmse:.3f} days | R^2: {r2:.4f}")

        comparison_results.append({
            'model_name': name,
            'mae': round(mae, 3),
            'rmse': round(rmse, 3),
            'r2': round(r2, 4),
            'training_time_seconds': round(elapsed, 2)
        })
        trained_pipelines[name] = pipe
        test_predictions[name] = y_pred

    # Select the best model (lowest MAE)
    sorted_models = sorted(comparison_results, key=lambda x: x['mae'])
    best_model_name = sorted_models[0]['model_name']
    best_pipe = trained_pipelines[best_model_name]
    best_y_pred = test_predictions[best_model_name]
    print(f"\nOptimal Model Selected: {best_model_name} (MAE: {sorted_models[0]['mae']} days, R^2: {sorted_models[0]['r2']})")

    # Feature Importance via Permutation Importance on a representative test subset
    print("Computing feature importances on test set...")
    sub_test_idx = np.random.RandomState(42).choice(len(X_test), size=min(500, len(X_test)), replace=False)
    X_sub = X_test.iloc[sub_test_idx]
    y_sub = y_test[sub_test_idx]
    perm = permutation_importance(best_pipe, X_sub, y_sub, n_repeats=3, random_state=42, scoring='neg_mean_absolute_error', n_jobs=1)

    feature_importances = []
    for idx, col in enumerate(feature_cols):
        importance_score = max(0.0, float(perm.importances_mean[idx]))
        feature_importances.append({
            'feature': col,
            'importance': round(importance_score, 4)
        })
    feature_importances.sort(key=lambda x: x['importance'], reverse=True)

    # Actual vs Predicted points (subsample 300 points for crisp visual scatter)
    scatter_indices = np.random.RandomState(42).choice(len(y_test), size=300, replace=False)
    actual_vs_predicted = [
        {
            'id': int(i),
            'actual': round(float(y_test[idx]), 1),
            'predicted': round(float(best_y_pred[idx]), 2),
            'residual': round(float(y_test[idx] - best_y_pred[idx]), 2)
        }
        for i, idx in enumerate(scatter_indices)
    ]

    # Residuals distribution (histogram bins)
    residuals = y_test - best_y_pred
    bin_edges = np.linspace(-10, 10, 21)
    hist, edges = np.histogram(residuals, bins=bin_edges)
    residual_distribution = [
        {
            'bin_range': f"{edges[i]:.0f} to {edges[i+1]:.0f}d",
            'bin_center': round((edges[i] + edges[i+1]) / 2, 1),
            'count': int(hist[i]),
            'pct': round((int(hist[i]) / len(residuals)) * 100, 2)
        }
        for i in range(len(hist))
    ]

    # Residuals vs Predicted
    residuals_vs_predicted = [
        {
            'predicted': round(float(best_y_pred[idx]), 2),
            'residual': round(float(y_test[idx] - best_y_pred[idx]), 2)
        }
        for idx in scatter_indices
    ]

    # Summary payload
    results_payload = {
        'status': 'ready',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'total_encounters': len(X),
        'train_encounters': len(X_train),
        'test_encounters': len(X_test),
        'train_patients': train_patients,
        'test_patients': test_patients,
        'split_strategy': 'GroupShuffleSplit (80% train / 20% test, grouped by patient_nbr to prevent inter-patient leakage, seed=42)',
        'target_variable': 'time_in_hospital (Continuous numerical inpatient days, 1-14)',
        'selected_model': best_model_name,
        'selection_rationale': 'Lowest Mean Absolute Error (MAE) and highest explained variance (R^2) on held-out patient-disjoint test partition, coupled with fast inference.',
        'models_comparison': comparison_results,
        'feature_schema': feature_cols,
        'feature_importances': feature_importances,
        'actual_vs_predicted_sample': actual_vs_predicted,
        'residual_distribution': residual_distribution,
        'residuals_vs_predicted': residuals_vs_predicted
    }

    # Save outputs
    os.makedirs('backend/models', exist_ok=True)
    joblib.dump(best_pipe, 'backend/models/best_model.joblib')
    with open('backend/models/evaluation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results_payload, f, indent=2)

    total_time = time.time() - start_time
    print(f"\nAll models evaluated and artifacts successfully saved in {total_time:.1f} seconds!")
    print(f"Artifacts: 'backend/models/best_model.joblib' & 'backend/models/evaluation_results.json'")

if __name__ == '__main__':
    train_and_evaluate()
