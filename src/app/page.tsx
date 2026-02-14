'use client';

import { useEffect, useState, useMemo } from 'react';
import { Activity, Skull, Heart, Syringe, Building2, Hospital, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, BarChartCard, PieChartCard } from '@/components';
import SpikeProteinViewer from '@/components/SpikeProteinViewer';
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
  ICUStatusDistribution
} from '@/lib/api';

interface DashboardData {
  infections: WeeklyInfection[];
  infectionsSummary?: {
    total_records?: number;
    total_infections?: number;
    average_weekly?: number;
  };
  deaths: MonthlyDeath[];
  deathsSummary?: {
    total_records?: number;
    total_deaths?: number;
  };
  icu: ICUUtilization[];
  vaccination: VaccinationProgress[];
  hospitalizations: HospitalizationTrend[];
  clinics: Clinic[];
  infectionsTimeseries: InfectionTimeseries[];
  deathsByAge: DeathsByAge[];
  icuStatus: ICUStatusDistribution[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    infections: [],
    infectionsSummary: undefined,
    deaths: [],
    deathsSummary: undefined,
    icu: [],
    vaccination: [],
    hospitalizations: [],
    clinics: [],
    infectionsTimeseries: [],
    deathsByAge: [],
    icuStatus: [],
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

  // Ensure all data arrays are safe
  const safeInfections = Array.isArray(data.infections) ? data.infections : [];
  const safeDeaths = useMemo(() => (Array.isArray(data.deaths) ? data.deaths : []), [data.deaths]);
  const safeIcu = useMemo(() => (Array.isArray(data.icu) ? data.icu : []), [data.icu]);
  const safeVaccination = Array.isArray(data.vaccination) ? data.vaccination : [];
  const safeHospitalizations = Array.isArray(data.hospitalizations) ? data.hospitalizations : [];
  const safeClinics = Array.isArray(data.clinics) ? data.clinics : [];
  const safeInfectionsTimeseries = Array.isArray(data.infectionsTimeseries) ? data.infectionsTimeseries : [];

  // Calculate summary statistics - use API summary when available
  const totalCases = data.infectionsSummary?.total_infections || 
    safeInfections.reduce((sum, r) => sum + (r.est_count || 0), 0);
  const totalDeaths = data.deathsSummary?.total_deaths || 
    safeDeaths.reduce((sum, r) => sum + (r.total_deaths || 0), 0);
  
  // Calculate avg COVID beds from ICU data
  const covidIcuData = safeIcu.filter(r => r.status?.toLowerCase() === 'covid');
  const avgCovidBeds = covidIcuData.length > 0 
    ? covidIcuData.reduce((sum, r) => sum + (r.avg_beds || 0), 0) / covidIcuData.length 
    : 0;
  
  // Get latest vaccination data (sorted by date, get last entry)
  const sortedVaccination = [...safeVaccination].sort((a, b) => 
    (a.vacc_date || '').localeCompare(b.vacc_date || '')
  );
  const latestVaccination = sortedVaccination.length > 0 ? sortedVaccination[sortedVaccination.length - 1] : null;
  const vaccinationUptake = latestVaccination?.received_one_dose_pcttakeup || 0;
  const totalHospitalizations = safeHospitalizations.reduce((sum, r) => sum + (r.total_count || 0), 0);
  const totalClinics = safeClinics.length;

  // Prepare chart data from visualization endpoints
  const infectionChartData = safeInfectionsTimeseries.map((r) => ({
    epi_week: r.epi_week || '',
    cases: r.est_count || 0,
  }));

  // Aggregate deaths by age group from monthly deaths data
  const deathsByAgeData = useMemo(() => {
    const totals: Record<string, number> = {};
    safeDeaths.forEach(r => {
      const age = r.age_groups || 'Unknown';
      totals[age] = (totals[age] || 0) + (r.total_deaths || 0);
    });
    return Object.entries(totals)
      .map(([age_group, deaths]) => ({ age_group, deaths }))
      .sort((a, b) => b.deaths - a.deaths);
  }, [safeDeaths]);

  // ICU status distribution for pie chart - aggregate from ICU data
  const icuStatusData = useMemo(() => {
    const totals: Record<string, number> = {};
    safeIcu.forEach(r => {
      const status = r.status || 'Unknown';
      totals[status] = (totals[status] || 0) + (r.avg_beds || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [safeIcu]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
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
          title="Avg COVID Beds"
          value={avgCovidBeds.toFixed(1)}
          icon={Heart}
          color="yellow"
        />
        <StatCard
          title="Vacc. Uptake"
          value={`${vaccinationUptake.toFixed(1)}%`}
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
      <div className="mb-8">
        <LineChartCard
          title="Infection Trends"
          data={infectionChartData}
          lines={[
            { dataKey: 'cases', color: '#ef4444', name: 'Cases' },
          ]}
          xAxisKey="epi_week"
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

      <div className="mt-6">
        <SpikeProteinViewer />
      </div>
    </div>
  );
}
