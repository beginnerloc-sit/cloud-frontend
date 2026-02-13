'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, WeeklyInfection, InfectionTimeseries } from '@/lib/api';

export default function InfectionsPage() {
  const [data, setData] = useState<WeeklyInfection[]>([]);
  const [timeseries, setTimeseries] = useState<InfectionTimeseries[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [weeklyData, timeseriesData] = await Promise.all([
        apiService.getWeeklyInfections(),
        apiService.getInfectionsTimeseries(),
      ]);
      setData(weeklyData);
      setTimeseries(timeseriesData);
    } catch (error) {
      console.error('Error loading infections data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCases = data.reduce((sum, r) => sum + (r.cases || 0), 0);
  const latestWeek = data.length > 0 ? data[data.length - 1] : null;

  const chartData = timeseries.map((r) => ({
    date: r.date || '',
    cases: r.cases || 0,
  }));

  // Group by epi_year for bar chart
  const yearData = data.reduce((acc: Record<number, number>, r) => {
    const year = r.epi_year || 0;
    acc[year] = (acc[year] || 0) + (r.cases || 0);
    return acc;
  }, {});

  const yearChartData = Object.entries(yearData)
    .map(([year, cases]) => ({ year, cases }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infections Data</h1>
          <p className="text-slate-500">Track and analyze COVID-19 infection cases by epidemiological week</p>
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
        <StatCard title="Total Cases" value={totalCases} icon={Activity} color="red" />
        <StatCard title="Latest Epi Week" value={latestWeek?.epi_week || '-'} icon={Activity} color="blue" />
        <StatCard title="Latest Epi Year" value={latestWeek?.epi_year || '-'} icon={Activity} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Infection Trends Over Time"
          data={chartData}
          lines={[
            { dataKey: 'cases', color: '#ef4444', name: 'Cases' },
          ]}
          loading={loading}
        />
        <BarChartCard
          title="Cases by Year"
          data={yearChartData}
          bars={[{ dataKey: 'cases', color: '#ef4444', name: 'Total Cases' }]}
          xAxisKey="year"
          loading={loading}
        />
      </div>

      <DataTable
        title="Weekly Infection Records"
        data={data.slice(-100)}
        columns={[
          { key: 'epi_year', header: 'Epi Year' },
          { key: 'epi_week', header: 'Epi Week' },
          { key: 'cases', header: 'Cases', render: (item) => (item.cases || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
