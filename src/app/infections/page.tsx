'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, InfectionRecord } from '@/lib/api';

export default function InfectionsPage() {
  const [data, setData] = useState<InfectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getInfections();
      setData(result);
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
  const totalRecovered = data.reduce((sum, r) => sum + (r.recovered || 0), 0);
  const totalActive = data.reduce((sum, r) => sum + (r.active || 0), 0);

  const chartData = data.slice(-30).map((r) => ({
    date: r.date,
    cases: r.cases,
    recovered: r.recovered || 0,
    active: r.active || 0,
  }));

  const regionData = data.reduce((acc: Record<string, number>, r) => {
    acc[r.region] = (acc[r.region] || 0) + r.cases;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData)
    .map(([region, cases]) => ({ region, cases }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infections Data</h1>
          <p className="text-slate-500">Track and analyze infection cases</p>
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
        <StatCard title="Recovered" value={totalRecovered} icon={Activity} color="green" />
        <StatCard title="Active Cases" value={totalActive} icon={Activity} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Infection Trends Over Time"
          data={chartData}
          lines={[
            { dataKey: 'cases', color: '#ef4444', name: 'New Cases' },
            { dataKey: 'recovered', color: '#10b981', name: 'Recovered' },
            { dataKey: 'active', color: '#f59e0b', name: 'Active' },
          ]}
          loading={loading}
        />
        <BarChartCard
          title="Cases by Region"
          data={regionChartData}
          bars={[{ dataKey: 'cases', color: '#ef4444', name: 'Total Cases' }]}
          xAxisKey="region"
          loading={loading}
        />
      </div>

      <DataTable
        title="Infection Records"
        data={data.slice(-100)}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'region', header: 'Region' },
          { key: 'cases', header: 'Cases', render: (item) => item.cases.toLocaleString() },
          { key: 'recovered', header: 'Recovered', render: (item) => (item.recovered || 0).toLocaleString() },
          { key: 'active', header: 'Active', render: (item) => (item.active || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
