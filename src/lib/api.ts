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
  request_id: string;
  records_received: number;
  status: string;
}

export interface InfectionRecord {
  id?: number;
  date: string;
  region: string;
  cases: number;
  recovered?: number;
  active?: number;
}

export interface DeathRecord {
  id?: number;
  date: string;
  region: string;
  deaths: number;
  cumulative_deaths?: number;
}

export interface ICURecord {
  id?: number;
  date: string;
  region: string;
  icu_patients: number;
  capacity?: number;
  utilization_rate?: number;
}

export interface VaccinationRecord {
  id?: number;
  date: string;
  region: string;
  doses_administered: number;
  first_dose?: number;
  second_dose?: number;
  booster?: number;
}

export interface HospitalizationRecord {
  id?: number;
  date: string;
  region: string;
  hospitalizations: number;
  discharged?: number;
  current_patients?: number;
}

export interface ClinicRecord {
  id?: number;
  name: string;
  region: string;
  address?: string;
  capacity?: number;
  type?: string;
}

export type DataType = 'infections' | 'deaths' | 'icu' | 'vaccination' | 'hospitalizations' | 'clinics';

// API Functions
export const apiService = {
  // Upload CSV file
  async uploadData(dataType: DataType, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<UploadResponse>(`/api/upload/${dataType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get infections data
  async getInfections(): Promise<InfectionRecord[]> {
    const response = await api.get<InfectionRecord[]>('/api/infections');
    return response.data;
  },

  // Get deaths data
  async getDeaths(): Promise<DeathRecord[]> {
    const response = await api.get<DeathRecord[]>('/api/deaths');
    return response.data;
  },

  // Get ICU data
  async getICU(): Promise<ICURecord[]> {
    const response = await api.get<ICURecord[]>('/api/icu');
    return response.data;
  },

  // Get vaccination data
  async getVaccination(): Promise<VaccinationRecord[]> {
    const response = await api.get<VaccinationRecord[]>('/api/vaccination');
    return response.data;
  },

  // Get hospitalizations data
  async getHospitalizations(): Promise<HospitalizationRecord[]> {
    const response = await api.get<HospitalizationRecord[]>('/api/hospitalizations');
    return response.data;
  },

  // Get clinics data
  async getClinics(): Promise<ClinicRecord[]> {
    const response = await api.get<ClinicRecord[]>('/api/clinics');
    return response.data;
  },

  // Get all data
  async getAllData() {
    const [infections, deaths, icu, vaccination, hospitalizations, clinics] = await Promise.all([
      this.getInfections().catch(() => []),
      this.getDeaths().catch(() => []),
      this.getICU().catch(() => []),
      this.getVaccination().catch(() => []),
      this.getHospitalizations().catch(() => []),
      this.getClinics().catch(() => []),
    ]);
    
    return { infections, deaths, icu, vaccination, hospitalizations, clinics };
  },
};

export default apiService;
