'use client';

import { useEffect, useState } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, PieChartCard } from '@/components';
import { apiService, ICUUtilization, ICUStatusDistribution } from '@/lib/api';

export default function ICUPage() {
  const [data, setData] = useState<ICUUtilization[]>([]);
  const [statusDist, setStatusDist] = useState<ICUStatusDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [utilData, statusData] = await Promise.all([
        apiService.getICUUtilization(),
        apiService.getICUStatusDistribution(),
      ]);
      setData(utilData);
      setStatusDist(statusData);
    } catch (error) {
      console.error('Error loading ICU data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const avgUtilization = data.length > 0 
    ? data.reduce((sum, r) => sum + (r.utilization_rate || 0), 0) / data.length 
    : 0;
  const totalBedsOccupied = data.reduce((sum, r) => sum + (r.beds_occupied || 0), 0);
  const totalBedsAvailable = data.reduce((sum, r) => sum + (r.beds_available || 0), 0);

  const chartData = data.map((r) => ({
    epi_week: r.epi_week || '',
    utilization_rate: r.utilization_rate || 0,
    beds_occupied: r.beds_occupied || 0,
  }));

  const statusPieData = statusDist.map((r) => ({
    name: r.status || 'Unknown',
    value: r.count || 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ICU Data</h1>
          <p className="text-slate-500">Monitor ICU bed utilization and status</p>
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
        <StatCard title="Avg Utilization" value={`${avgUtilization.toFixed(1)}%`} icon={Heart} color="yellow" />
        <StatCard title="Beds Occupied" value={totalBedsOccupied} icon={Heart} color="red" />
        <StatCard title="Beds Available" value={totalBedsAvailable} icon={Heart} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="ICU Utilization Over Time"
          data={chartData}
          lines={[
            { dataKey: 'utilization_rate', color: '#f59e0b', name: 'Utilization Rate (%)' },
          ]}
          xAxisKey="epi_week"
          loading={loading}
        />
        <PieChartCard
          title="ICU Status Distribution"
          data={statusPieData}
          loading={loading}
        />
      </div>

      <DataTable
        title="ICU Utilization Records"
        data={data}
        columns={[
          { key: 'epi_week', header: 'Epi Week' },
          { key: 'beds_occupied', header: 'Beds Occupied' },
          { key: 'beds_available', header: 'Beds Available' },
          { key: 'utilization_rate', header: 'Utilization', render: (item) => `${(item.utilization_rate || 0).toFixed(1)}%` },
        ]}
        loading={loading}
      />
    </div>
  );
}
