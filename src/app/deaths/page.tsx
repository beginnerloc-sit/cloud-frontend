'use client';

import { useEffect, useState } from 'react';
import { Skull, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, MonthlyDeath, DeathsByAge } from '@/lib/api';

export default function DeathsPage() {
  const [data, setData] = useState<MonthlyDeath[]>([]);
  const [deathsByAge, setDeathsByAge] = useState<DeathsByAge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [monthlyData, ageData] = await Promise.all([
        apiService.getMonthlyDeaths(),
        apiService.getDeathsByAge(),
      ]);
      setData(monthlyData);
      setDeathsByAge(ageData);
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
  const latestMonth = data.length > 0 ? data[data.length - 1] : null;

  const chartData = data.map((r) => ({
    month: r.month || '',
    deaths: r.deaths || 0,
  }));

  const ageChartData = deathsByAge.map((r) => ({
    age_group: r.age_group || 'Unknown',
    deaths: r.deaths || 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deaths Data</h1>
          <p className="text-slate-500">Track and analyze COVID-19 mortality data</p>
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
        <StatCard title="Total Deaths" value={totalDeaths} icon={Skull} color="red" />
        <StatCard title="Latest Month" value={latestMonth?.month || '-'} icon={Skull} color="purple" />
        <StatCard title="Age Groups" value={deathsByAge.length} icon={Skull} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Monthly Deaths Trend"
          data={chartData}
          lines={[
            { dataKey: 'deaths', color: '#ef4444', name: 'Deaths' },
          ]}
          xAxisKey="month"
          loading={loading}
        />
        <BarChartCard
          title="Deaths by Age Group"
          data={ageChartData}
          bars={[{ dataKey: 'deaths', color: '#8b5cf6', name: 'Deaths' }]}
          xAxisKey="age_group"
          loading={loading}
        />
      </div>

      <DataTable
        title="Monthly Death Records"
        data={data}
        columns={[
          { key: 'month', header: 'Month' },
          { key: 'deaths', header: 'Deaths', render: (item) => (item.deaths || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
