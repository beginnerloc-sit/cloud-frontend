'use client';

import { useEffect, useState } from 'react';
import { Activity, Skull, Heart, Syringe, Building2, Hospital, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, BarChartCard, PieChartCard } from '@/components';
import { 
  apiService, 
  WeeklyInfection, 
  MonthlyDeath, 
  ICUUtilization, 
  VaccinationProgress, 
  HospitalizationTrend, 
  Clinic,
  InfectionTimeseries,
  DeathsByAge,
  ICUStatusDistribution,
  VaccinationUptakeTrend
} from '@/lib/api';

interface DashboardData {
  infections: WeeklyInfection[];
  deaths: MonthlyDeath[];
  icu: ICUUtilization[];
  vaccination: VaccinationProgress[];
  hospitalizations: HospitalizationTrend[];
  clinics: Clinic[];
  infectionsTimeseries: InfectionTimeseries[];
  deathsByAge: DeathsByAge[];
  icuStatus: ICUStatusDistribution[];
  vaccinationUptake: VaccinationUptakeTrend[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    infections: [],
    deaths: [],
    icu: [],
    vaccination: [],
    hospitalizations: [],
    clinics: [],
    infectionsTimeseries: [],
    deathsByAge: [],
    icuStatus: [],
    vaccinationUptake: [],
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
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate summary statistics
  const totalCases = data.infections.reduce((sum, r) => sum + (r.cases || 0), 0);
  const totalDeaths = data.deaths.reduce((sum, r) => sum + (r.deaths || 0), 0);
  const avgICUUtilization = data.icu.length > 0 
    ? data.icu.reduce((sum, r) => sum + (r.utilization_rate || 0), 0) / data.icu.length 
    : 0;
  const totalVaccinations = data.vaccination.reduce((sum, r) => sum + (r.doses_administered || 0), 0);
  const totalHospitalizations = data.hospitalizations.reduce((sum, r) => sum + (r.count || 0), 0);
  const totalClinics = data.clinics.length;

  // Prepare chart data from visualization endpoints
  const infectionChartData = data.infectionsTimeseries.map((r) => ({
    date: r.date || '',
    cases: r.cases || 0,
  }));

  const vaccinationChartData = data.vaccinationUptake.map((r) => ({
    date: r.date || '',
    uptake: r.uptake || 0,
  }));

  // Deaths by age for bar chart
  const deathsByAgeData = data.deathsByAge.map((r) => ({
    age_group: r.age_group || 'Unknown',
    deaths: r.deaths || 0,
  }));

  // ICU status distribution for pie chart
  const icuStatusData = data.icuStatus.map((r) => ({
    name: r.status || 'Unknown',
    value: r.count || 0,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">COVID-19 Analytics Dashboard</h1>
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
          title="ICU Utilization"
          value={`${avgICUUtilization.toFixed(1)}%`}
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
            { dataKey: 'cases', color: '#ef4444', name: 'Cases' },
          ]}
          loading={loading}
        />
        <LineChartCard
          title="Vaccination Uptake Trend"
          data={vaccinationChartData}
          lines={[
            { dataKey: 'uptake', color: '#10b981', name: 'Uptake' },
          ]}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Deaths by Age Group"
          data={deathsByAgeData}
          bars={[
            { dataKey: 'deaths', color: '#8b5cf6', name: 'Deaths' },
          ]}
          xAxisKey="age_group"
          loading={loading}
        />
        <PieChartCard
          title="ICU Status Distribution"
          data={icuStatusData}
          loading={loading}
        />
      </div>
    </div>
  );
}
