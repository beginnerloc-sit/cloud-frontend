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
  epi_week?: number;
  cases?: number;
  [key: string]: unknown;
}

export interface HospitalizationTrend {
  date?: string;
  clinical_status?: string;
  age_group?: string;
  count?: number;
  [key: string]: unknown;
}

export interface MonthlyDeath {
  month?: string;
  deaths?: number;
  [key: string]: unknown;
}

export interface ICUUtilization {
  epi_week?: string;
  beds_available?: number;
  beds_occupied?: number;
  utilization_rate?: number;
  [key: string]: unknown;
}

export interface VaccinationProgress {
  date?: string;
  doses_administered?: number;
  first_dose?: number;
  second_dose?: number;
  booster?: number;
  [key: string]: unknown;
}

export interface VaccinationByAge {
  age_group?: string;
  vaccinated?: number;
  unvaccinated?: number;
  [key: string]: unknown;
}

export interface Clinic {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  [key: string]: unknown;
}

// Visualization types
export interface InfectionTimeseries {
  date?: string;
  cases?: number;
  [key: string]: unknown;
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

export interface HospitalizationHeatmap {
  date?: string;
  age_group?: string;
  value?: number;
  [key: string]: unknown;
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
  async getWeeklyInfections(params?: { epi_year?: number; limit?: number }): Promise<WeeklyInfection[]> {
    const response = await api.get<WeeklyInfection[]>('/api/analytics/infections/weekly', { params });
    return response.data;
  },

  async getHospitalizationTrend(params?: { clinical_status?: string; age_group?: string }): Promise<HospitalizationTrend[]> {
    const response = await api.get<HospitalizationTrend[]>('/api/analytics/hospitalizations/trend', { params });
    return response.data;
  },

  async getMonthlyDeaths(params?: { month?: string }): Promise<MonthlyDeath[]> {
    const response = await api.get<MonthlyDeath[]>('/api/analytics/deaths/monthly', { params });
    return response.data;
  },

  async getICUUtilization(params?: { epi_week?: string }): Promise<ICUUtilization[]> {
    const response = await api.get<ICUUtilization[]>('/api/analytics/icu/utilization', { params });
    return response.data;
  },

  async getVaccinationProgress(params?: { start_date?: string; end_date?: string; limit?: number }): Promise<VaccinationProgress[]> {
    const response = await api.get<VaccinationProgress[]>('/api/analytics/vaccination/progress', { params });
    return response.data;
  },

  async getVaccinationByAge(): Promise<VaccinationByAge[]> {
    const response = await api.get<VaccinationByAge[]>('/api/analytics/vaccination/by-age');
    return response.data;
  },

  async getClinics(params?: { search?: string }): Promise<Clinic[]> {
    const response = await api.get<Clinic[]>('/api/analytics/clinics', { params });
    return response.data;
  },

  // ============ Visualization endpoints ============
  async getInfectionsTimeseries(): Promise<InfectionTimeseries[]> {
    const response = await api.get<InfectionTimeseries[]>('/api/viz/infections/timeseries');
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

  async getHospitalizationHeatmap(): Promise<HospitalizationHeatmap[]> {
    const response = await api.get<HospitalizationHeatmap[]>('/api/viz/hospitalizations/heatmap');
    return response.data;
  },

  // ============ Get all dashboard data ============
  async getAllData() {
    const [
      infections,
      deaths,
      icu,
      vaccination,
      hospitalizations,
      clinics,
      infectionsTimeseries,
      deathsByAge,
      icuStatus,
      vaccinationUptake,
    ] = await Promise.all([
      this.getWeeklyInfections().catch(() => []),
      this.getMonthlyDeaths().catch(() => []),
      this.getICUUtilization().catch(() => []),
      this.getVaccinationProgress().catch(() => []),
      this.getHospitalizationTrend().catch(() => []),
      this.getClinics().catch(() => []),
      this.getInfectionsTimeseries().catch(() => []),
      this.getDeathsByAge().catch(() => []),
      this.getICUStatusDistribution().catch(() => []),
      this.getVaccinationUptakeTrend().catch(() => []),
    ]);

    return {
      infections,
      deaths,
      icu,
      vaccination,
      hospitalizations,
      clinics,
      infectionsTimeseries,
      deathsByAge,
      icuStatus,
      vaccinationUptake,
    };
  },
};

export default apiService;
