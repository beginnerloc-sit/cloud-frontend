'use client';

import { useEffect, useState } from 'react';
import { Skull, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, DeathRecord } from '@/lib/api';

export default function DeathsPage() {
  const [data, setData] = useState<DeathRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getDeaths();
      setData(result);
    } catch (error) {
      console.error('Error loading deaths data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDeaths = data.reduce((sum, r) => sum + (r.deaths || 0), 0);
  const latestCumulative = data.length > 0 ? (data[data.length - 1].cumulative_deaths || totalDeaths) : 0;

  const chartData = data.slice(-30).map((r) => ({
    date: r.date,
    deaths: r.deaths,
    cumulative: r.cumulative_deaths || 0,
  }));

  const regionData = data.reduce((acc: Record<string, number>, r) => {
    acc[r.region] = (acc[r.region] || 0) + r.deaths;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData)
    .map(([region, deaths]) => ({ region, deaths }))
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deaths Data</h1>
          <p className="text-slate-500">Track and analyze mortality data</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard title="Total Deaths" value={totalDeaths} icon={Skull} color="red" />
        <StatCard title="Cumulative Deaths" value={latestCumulative} icon={Skull} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Deaths Over Time"
          data={chartData}
          lines={[
            { dataKey: 'deaths', color: '#ef4444', name: 'Daily Deaths' },
            { dataKey: 'cumulative', color: '#8b5cf6', name: 'Cumulative' },
          ]}
          loading={loading}
        />
        <BarChartCard
          title="Deaths by Region"
          data={regionChartData}
          bars={[{ dataKey: 'deaths', color: '#8b5cf6', name: 'Total Deaths' }]}
          xAxisKey="region"
          loading={loading}
        />
      </div>

      <DataTable
        title="Death Records"
        data={data.slice(-100)}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'region', header: 'Region' },
          { key: 'deaths', header: 'Deaths', render: (item) => item.deaths.toLocaleString() },
          { key: 'cumulative_deaths', header: 'Cumulative', render: (item) => (item.cumulative_deaths || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
