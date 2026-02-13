'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
import { StatCard, LineChartCard, DataTable } from '@/components';
import { apiService, WeeklyInfection, WeeklyInfectionsResponse, InfectionTimeseriesResponse } from '@/lib/api';

export default function InfectionsPage() {
  const [weeklyResponse, setWeeklyResponse] = useState<WeeklyInfectionsResponse | null>(null);
  const [timeseriesResponse, setTimeseriesResponse] = useState<InfectionTimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [weekly, timeseries] = await Promise.all([
        apiService.getWeeklyInfections(),
        apiService.getInfectionsTimeseries(),
      ]);
      setWeeklyResponse(weekly);
      setTimeseriesResponse(timeseries);
    } catch (error) {
      console.error('Error loading infections data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract data from responses
  const weeklyData: WeeklyInfection[] = Array.isArray(weeklyResponse?.data) ? weeklyResponse.data : [];
  const summary = weeklyResponse?.summary;
  
  // Use timeseries data for chart (already sorted by epi_week)
  const timeseriesData = Array.isArray(timeseriesResponse?.data) ? timeseriesResponse.data : [];
  
  const chartData = timeseriesData.map((r) => ({
    epi_week: r.epi_week || '',
    cases: r.est_count || 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infections Data</h1>
          <p className="text-slate-500">COVID-19 infection cases by epidemiological week</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          title="Total Infections" 
          value={(summary?.total_infections || 0).toLocaleString()} 
          icon={Activity} 
          color="red" 
        />
        <StatCard 
          title="Average Weekly" 
          value={(summary?.average_weekly || 0).toLocaleString()} 
          icon={TrendingUp} 
          color="blue" 
        />
        <StatCard 
          title="Total Records" 
          value={summary?.total_records || 0} 
          icon={Calendar} 
          color="green" 
        />
      </div>

      <div className="mb-8">
        <LineChartCard
          title={timeseriesResponse?.title || "COVID-19 Infections by Epi-week"}
          data={chartData}
          lines={[{ dataKey: 'cases', color: '#ef4444', name: 'Cases' }]}
          xAxisKey="epi_week"
          loading={loading}
        />
      </div>

      <DataTable
        title="Weekly Infection Records"
        data={weeklyData}
        columns={[
          { key: 'epi_year', header: 'Year' },
          { key: 'epi_week', header: 'Epi Week' },
          { key: 'est_count', header: 'Estimated Cases', render: (item) => (item.est_count || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
