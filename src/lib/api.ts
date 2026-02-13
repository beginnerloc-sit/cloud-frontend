import axios from 'axios';

// API Base URL - configure this to match your backend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface UploadResponse {
  status: string;
  message: string;
  request_id: string;
  records_received: number;
}

// Analytics types
export interface WeeklyInfection {
  epi_year?: number;
  epi_week?: string;
  est_count?: number;
  [key: string]: unknown;
}

export interface WeeklyInfectionsResponse {
  data: WeeklyInfection[];
  summary?: {
    total_records?: number;
    total_infections?: number;
    average_weekly?: number;
  };
}

export interface HospitalizationTrend {
  epi_year?: number;
  epi_week?: string;
  clinical_status?: string;
  age_groups?: string;
  total_count?: number;
  [key: string]: unknown;
}

export interface HospitalizationTrendResponse {
  data: HospitalizationTrend[];
  summary?: {
    total_records?: number;
    total_cases?: number;
  };
}

export interface MonthlyDeath {
  as_of_month?: string;
  age_groups?: string;
  total_deaths?: number;
  [key: string]: unknown;
}

export interface MonthlyDeathsResponse {
  data: MonthlyDeath[];
  summary?: {
    total_records?: number;
    total_deaths?: number;
  };
}

export interface ICUUtilization {
  epi_year?: number;
  epi_week?: string;
  status?: string;
  avg_beds?: number;
  [key: string]: unknown;
}

export interface ICUUtilizationResponse {
  data: ICUUtilization[];
  summary?: {
    total_records?: number;
  };
}

export interface VaccinationProgress {
  vacc_date?: string;
  received_at_least_one_dose?: number;
  full_regimen?: number;
  minimum_protection?: number;
  received_one_dose_pcttakeup?: number;
  full_regimen_pcttakeup?: number;
  minimum_protection_pcttakeup?: number;
  [key: string]: unknown;
}

export interface VaccinationProgressResponse {
  data: VaccinationProgress[];
  summary?: {
    total_records?: number;
  };
}

export interface VaccinationByAge {
  age?: string;
  no_minimum_protection?: number;
  minimum_protection?: number;
  [key: string]: unknown;
}

export interface VaccinationByAgeResponse {
  data: VaccinationByAge[];
  summary?: {
    total_age_groups?: number;
    overall_protected?: number;
    overall_unprotected?: number;
  };
}

export interface Clinic {
  name?: string;
  address?: string;
  vaccine?: string;
  [key: string]: unknown;
}

export interface ClinicsResponse {
  data: Clinic[];
  summary?: {
    total_clinics?: number;
  };
}

// Visualization types
export interface InfectionTimeseries {
  epi_year?: number;
  epi_week?: string;
  est_count?: number;
  [key: string]: unknown;
}

export interface InfectionTimeseriesResponse {
  chart_type?: string;
  x_axis?: string[];
  y_axis?: number[];
  title?: string;
  data: InfectionTimeseries[];
}

export interface DeathsByAge {
  age_group?: string;
  deaths?: number;
  [key: string]: unknown;
}

export interface ICUStatusDistribution {
  status?: string;
  count?: number;
  [key: string]: unknown;
}

export interface VaccinationUptakeTrend {
  date?: string;
  uptake?: number;
  [key: string]: unknown;
}

export interface HospitalizationHeatmapRawData {
  epi_week?: string;
  age_groups?: string;
  total_count?: number;
}

export interface HospitalizationHeatmap {
  chart_type?: string;
  x_labels?: string[];
  y_labels?: string[];
  data_matrix?: number[][];
  title?: string;
  raw_data?: HospitalizationHeatmapRawData[];
}

// Upload data types
export type UploadDataType = 
  | 'infections'
  | 'deaths'
  | 'hospitalizations'
  | 'icu-utilization'
  | 'new-admissions'
  | 'vaccination-progress'
  | 'vaccination-by-age'
  | 'clinics';

// API Functions
export const apiService = {
  // ============ Upload endpoints ============
  async uploadData(dataType: UploadDataType, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<UploadResponse>(`/api/upload/${dataType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ============ Analytics endpoints ============
  async getWeeklyInfections(params?: { epi_year?: number; limit?: number }): Promise<WeeklyInfectionsResponse> {
    const response = await api.get<WeeklyInfectionsResponse>('/api/analytics/infections/weekly', { params });
    return response.data;
  },

  async getHospitalizationTrend(params?: { clinical_status?: string; age_group?: string }): Promise<HospitalizationTrendResponse> {
    const response = await api.get<HospitalizationTrendResponse>('/api/analytics/hospitalizations/trend', { params });
    return response.data;
  },

  async getMonthlyDeaths(params?: { month?: string }): Promise<MonthlyDeathsResponse> {
    const response = await api.get<MonthlyDeathsResponse>('/api/analytics/deaths/monthly', { params });
    return response.data;
  },

  async getICUUtilization(params?: { epi_week?: string }): Promise<ICUUtilizationResponse> {
    const response = await api.get<ICUUtilizationResponse>('/api/analytics/icu/utilization', { params });
    return response.data;
  },

  async getVaccinationProgress(params?: { start_date?: string; end_date?: string; limit?: number }): Promise<VaccinationProgressResponse> {
    const response = await api.get<VaccinationProgressResponse>('/api/analytics/vaccination/progress', { params });
    return response.data;
  },

  async getVaccinationByAge(): Promise<VaccinationByAgeResponse> {
    const response = await api.get<VaccinationByAgeResponse>('/api/analytics/vaccination/by-age');
    return response.data;
  },

  async getClinics(params?: { search?: string }): Promise<ClinicsResponse> {
    const response = await api.get<ClinicsResponse>('/api/analytics/clinics', { params });
    return response.data;
  },

  // ============ Visualization endpoints ============
  async getInfectionsTimeseries(): Promise<InfectionTimeseriesResponse> {
    const response = await api.get<InfectionTimeseriesResponse>('/api/viz/infections/timeseries');
    return response.data;
  },

  async getDeathsByAge(): Promise<DeathsByAge[]> {
    const response = await api.get<DeathsByAge[]>('/api/viz/deaths/by-age');
    return response.data;
  },

  async getICUStatusDistribution(): Promise<ICUStatusDistribution[]> {
    const response = await api.get<ICUStatusDistribution[]>('/api/viz/icu/status-distribution');
    return response.data;
  },

  async getVaccinationUptakeTrend(): Promise<VaccinationUptakeTrend[]> {
    const response = await api.get<VaccinationUptakeTrend[]>('/api/viz/vaccination/uptake-trend');
    return response.data;
  },

  async getHospitalizationHeatmap(): Promise<HospitalizationHeatmap> {
    const response = await api.get<HospitalizationHeatmap>('/api/viz/hospitalizations/heatmap');
    return response.data;
  },

  // ============ Get all dashboard data ============
  async getAllData() {
    const [
      infectionsResponse,
      deathsResponse,
      icuResponse,
      vaccinationResponse,
      hospitalizationsResponse,
      clinicsResponse,
      infectionsTimeseriesResponse,
      deathsByAge,
      icuStatus,
      vaccinationUptake,
    ] = await Promise.all([
      this.getWeeklyInfections().catch(() => ({ data: [], summary: undefined })),
      this.getMonthlyDeaths().catch(() => ({ data: [], summary: undefined })),
      this.getICUUtilization().catch(() => ({ data: [], summary: undefined })),
      this.getVaccinationProgress().catch(() => ({ data: [], summary: undefined })),
      this.getHospitalizationTrend().catch(() => ({ data: [], summary: undefined })),
      this.getClinics().catch(() => ({ data: [], summary: undefined })),
      this.getInfectionsTimeseries().catch(() => ({ data: [] })),
      this.getDeathsByAge().catch(() => []),
      this.getICUStatusDistribution().catch(() => []),
      this.getVaccinationUptakeTrend().catch(() => []),
    ]);

    return {
      infections: infectionsResponse.data || [],
      infectionsSummary: infectionsResponse.summary,
      deaths: deathsResponse.data || [],
      deathsSummary: deathsResponse.summary,
      icu: icuResponse.data || [],
      icuSummary: icuResponse.summary,
      vaccination: vaccinationResponse.data || [],
      vaccinationSummary: vaccinationResponse.summary,
      hospitalizations: hospitalizationsResponse.data || [],
      hospitalizationsSummary: hospitalizationsResponse.summary,
      clinics: clinicsResponse.data || [],
      clinicsSummary: clinicsResponse.summary,
      infectionsTimeseries: infectionsTimeseriesResponse.data || [],
      deathsByAge,
      icuStatus,
      vaccinationUptake,
    };
  },
};

export default apiService;
