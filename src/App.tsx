import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useDataContext } from './context/DataContext';
import AppLayout from './components/AppLayout';
import LoadingScreen from './components/LoadingScreen';
import OverviewPage from './pages/OverviewPage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import DataPreparationPage from './pages/DataPreparationPage';
import EDAPage from './pages/EDAPage';
import StatisticsPage from './pages/StatisticsPage';
import LOSPredictionPage from './pages/LOSPredictionPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import AboutPage from './pages/AboutPage';

function AppInner() {
  const { progress, error, isReady, reload, loadFromFiles } = useDataContext();

  // Show loading/error screen until dataset is ready
  if (!isReady) {
    return (
      <LoadingScreen
        progress={progress}
        error={error}
        onRetry={reload}
        onManualLoad={loadFromFiles}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="explorer" element={<DatasetExplorerPage />} />
        <Route path="preparation" element={<DataPreparationPage />} />
        <Route path="eda" element={<EDAPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="prediction" element={<LOSPredictionPage />} />
        <Route path="evaluation" element={<ModelEvaluationPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <AppInner />
      </DataProvider>
    </BrowserRouter>
  );
}
