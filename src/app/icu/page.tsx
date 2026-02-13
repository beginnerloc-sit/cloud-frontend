'use client';

import { useEffect, useState } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, ICURecord } from '@/lib/api';

export default function ICUPage() {
  const [data, setData] = useState<ICURecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getICU();
      setData(result);
    } catch (error) {
      console.error('Error loading ICU data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalICUPatients = data.reduce((sum, r) => sum + (r.icu_patients || 0), 0);
  const totalCapacity = data.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const avgUtilization = data.length > 0 
    ? data.reduce((sum, r) => sum + (r.utilization_rate || 0), 0) / data.length 
    : 0;

  const chartData = data.slice(-30).map((r) => ({
    date: r.date,
    patients: r.icu_patients,
    capacity: r.capacity || 0,
  }));

  const regionData = data.reduce((acc: Record<string, number>, r) => {
    acc[r.region] = (acc[r.region] || 0) + r.icu_patients;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData)
    .map(([region, patients]) => ({ region, patients }))
    .sort((a, b) => b.patients - a.patients)
    .slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ICU Data</h1>
          <p className="text-slate-500">Monitor ICU capacity and utilization</p>
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
        <StatCard title="ICU Patients" value={totalICUPatients} icon={Heart} color="red" />
        <StatCard title="Total Capacity" value={totalCapacity} icon={Heart} color="blue" />
        <StatCard title="Avg Utilization" value={`${avgUtilization.toFixed(1)}%`} icon={Heart} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="ICU Trends Over Time"
          data={chartData}
          lines={[
            { dataKey: 'patients', color: '#ef4444', name: 'ICU Patients' },
            { dataKey: 'capacity', color: '#3b82f6', name: 'Capacity' },
          ]}
          loading={loading}
        />
        <BarChartCard
          title="ICU Patients by Region"
          data={regionChartData}
          bars={[{ dataKey: 'patients', color: '#f59e0b', name: 'ICU Patients' }]}
          xAxisKey="region"
          loading={loading}
        />
      </div>

      <DataTable
        title="ICU Records"
        data={data.slice(-100)}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'region', header: 'Region' },
          { key: 'icu_patients', header: 'Patients', render: (item) => item.icu_patients.toLocaleString() },
          { key: 'capacity', header: 'Capacity', render: (item) => (item.capacity || 0).toLocaleString() },
          { key: 'utilization_rate', header: 'Utilization', render: (item) => `${(item.utilization_rate || 0).toFixed(1)}%` },
        ]}
        loading={loading}
      />
    </div>
  );
}
