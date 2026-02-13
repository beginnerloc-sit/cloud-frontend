'use client';

import { useEffect, useState } from 'react';
import { Activity, Skull, Heart, Syringe, Building2, Hospital, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, BarChartCard } from '@/components';
import { apiService, InfectionRecord, DeathRecord, ICURecord, VaccinationRecord, HospitalizationRecord, ClinicRecord } from '@/lib/api';

interface DashboardData {
  infections: InfectionRecord[];
  deaths: DeathRecord[];
  icu: ICURecord[];
  vaccination: VaccinationRecord[];
  hospitalizations: HospitalizationRecord[];
  clinics: ClinicRecord[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    infections: [],
    deaths: [],
    icu: [],
    vaccination: [],
    hospitalizations: [],
    clinics: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getAllData();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate summary statistics
  const totalCases = data.infections.reduce((sum, r) => sum + (r.cases || 0), 0);
  const totalDeaths = data.deaths.reduce((sum, r) => sum + (r.deaths || 0), 0);
  const totalICU = data.icu.reduce((sum, r) => sum + (r.icu_patients || 0), 0);
  const totalVaccinations = data.vaccination.reduce((sum, r) => sum + (r.doses_administered || 0), 0);
  const totalHospitalizations = data.hospitalizations.reduce((sum, r) => sum + (r.hospitalizations || 0), 0);
  const totalClinics = data.clinics.length;

  // Prepare chart data - aggregate by date
  const infectionChartData = data.infections.slice(-30).map((r) => ({
    date: r.date,
    cases: r.cases,
    recovered: r.recovered || 0,
  }));

  const vaccinationChartData = data.vaccination.slice(-30).map((r) => ({
    date: r.date,
    doses: r.doses_administered,
  }));

  // Aggregate by region for bar chart
  const regionData = data.infections.reduce((acc: Record<string, number>, r) => {
    acc[r.region] = (acc[r.region] || 0) + r.cases;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData).map(([region, cases]) => ({
    region,
    cases,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Analytics Dashboard</h1>
          <p className="text-slate-500">
            {lastUpdated 
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Loading data...'}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Cases"
          value={totalCases}
          icon={Activity}
          color="red"
        />
        <StatCard
          title="Total Deaths"
          value={totalDeaths}
          icon={Skull}
          color="purple"
        />
        <StatCard
          title="ICU Patients"
          value={totalICU}
          icon={Heart}
          color="yellow"
        />
        <StatCard
          title="Vaccinations"
          value={totalVaccinations}
          icon={Syringe}
          color="green"
        />
        <StatCard
          title="Hospitalizations"
          value={totalHospitalizations}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Clinics"
          value={totalClinics}
          icon={Hospital}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Infection Trends"
          data={infectionChartData}
          lines={[
            { dataKey: 'cases', color: '#ef4444', name: 'New Cases' },
            { dataKey: 'recovered', color: '#10b981', name: 'Recovered' },
          ]}
          loading={loading}
        />
        <LineChartCard
          title="Vaccination Progress"
          data={vaccinationChartData}
          lines={[
            { dataKey: 'doses', color: '#3b82f6', name: 'Doses Administered' },
          ]}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Cases by Region"
          data={regionChartData.slice(0, 10)}
          bars={[
            { dataKey: 'cases', color: '#ef4444', name: 'Total Cases' },
          ]}
          xAxisKey="region"
          loading={loading}
        />
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Records</span>
              <span className="font-semibold text-slate-900">
                {data.infections.length + data.deaths.length + data.icu.length + 
                 data.vaccination.length + data.hospitalizations.length + data.clinics.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Regions Covered</span>
              <span className="font-semibold text-slate-900">
                {new Set(data.infections.map(r => r.region)).size}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Data Types</span>
              <span className="font-semibold text-slate-900">6</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">API Status</span>
              <span className="inline-flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
