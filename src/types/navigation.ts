import { 
  LayoutDashboard, 
  Database, 
  Sliders, 
  BarChart3, 
  Binary, 
  Sparkles, 
  Award, 
  BookOpen 
} from 'lucide-react';

export interface NavRoute {
  path: string;
  name: string;
  shortDesc: string;
  badge?: string;
  iconName: string;
}

export const APP_ROUTES = [
  {
    path: '/',
    name: 'Overview',
    shortDesc: 'Executive research summary & data integrity KPIs',
    icon: LayoutDashboard,
    routeId: 'overview'
  },
  {
    path: '/explorer',
    name: 'Dataset Explorer',
    shortDesc: 'Raw & mapped clinical encounters grid (101,766 rows)',
    icon: Database,
    routeId: 'explorer'
  },
  {
    path: '/preparation',
    name: 'Data Preparation',
    shortDesc: 'Sentinel handling, type coercion & data cleaning audit',
    icon: Sliders,
    routeId: 'preparation'
  },
  {
    path: '/eda',
    name: 'Exploratory Data Analysis',
    shortDesc: 'Multivariate distributions & clinical pattern mining',
    icon: BarChart3,
    routeId: 'eda'
  },
  {
    path: '/statistics',
    name: 'Statistical Investigation',
    shortDesc: 'Parametric & non-parametric LOS hypothesis tests',
    icon: Binary,
    routeId: 'statistics'
  },
  {
    path: '/prediction',
    name: 'LOS Prediction',
    shortDesc: 'Patient stay estimation & feature sensitivity inference',
    icon: Sparkles,
    routeId: 'prediction'
  },
  {
    path: '/evaluation',
    name: 'Model Evaluation',
    shortDesc: 'Validation benchmarks & algorithmic performance metrics',
    icon: Award,
    routeId: 'evaluation'
  },
  {
    path: '/about',
    name: 'About the Research',
    shortDesc: 'Study methodology, provenance & academic citations',
    icon: BookOpen,
    routeId: 'about'
  }
] as const;
