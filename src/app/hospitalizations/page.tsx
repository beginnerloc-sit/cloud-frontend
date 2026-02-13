'use client';

import { useEffect, useState } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, HospitalizationTrend, HospitalizationHeatmap } from '@/lib/api';

export default function HospitalizationsPage() {
  const [data, setData] = useState<HospitalizationTrend[]>([]);
  const [heatmapData, setHeatmapData] = useState<HospitalizationHeatmap[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trendData, heatmap] = await Promise.all([
        apiService.getHospitalizationTrend(),
        apiService.getHospitalizationHeatmap(),
      ]);
      setData(trendData);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error('Error loading hospitalizations data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCount = data.reduce((sum, r) => sum + (r.count || 0), 0);

  // Group by clinical status
  const statusData = data.reduce((acc: Record<string, number>, r) => {
    const status = r.clinical_status || 'Unknown';
    acc[status] = (acc[status] || 0) + (r.count || 0);
    return acc;
  }, {});
  const statusChartData = Object.entries(statusData)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Group by age group
  const ageData = data.reduce((acc: Record<string, number>, r) => {
    const age = r.age_group || 'Unknown';
    acc[age] = (acc[age] || 0) + (r.count || 0);
    return acc;
  }, {});
  const ageChartData = Object.entries(ageData)
    .map(([age_group, count]) => ({ age_group, count }))
    .sort((a, b) => b.count - a.count);

  // Timeline chart from heatmap data
  const timelineData = heatmapData.reduce((acc: Record<string, number>, r) => {
    const date = r.date || '';
    acc[date] = (acc[date] || 0) + (r.value || 0);
    return acc;
  }, {});
  const chartData = Object.entries(timelineData)
    .map(([date, value]) => ({ date, hospitalizations: value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospitalizations Data</h1>
          <p className="text-slate-500">Monitor hospitalization trends by clinical status and age</p>
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
        <StatCard title="Total Hospitalizations" value={totalCount} icon={Building2} color="blue" />
        <StatCard title="Clinical Statuses" value={Object.keys(statusData).length} icon={Building2} color="green" />
        <StatCard title="Age Groups" value={Object.keys(ageData).length} icon={Building2} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Hospitalization Trends Over Time"
          data={chartData}
          lines={[
            { dataKey: 'hospitalizations', color: '#3b82f6', name: 'Hospitalizations' },
          ]}
          loading={loading}
        />
        <BarChartCard
          title="By Clinical Status"
          data={statusChartData}
          bars={[{ dataKey: 'count', color: '#3b82f6', name: 'Count' }]}
          xAxisKey="status"
          loading={loading}
        />
      </div>

      <div className="mb-8">
        <BarChartCard
          title="By Age Group"
          data={ageChartData}
          bars={[{ dataKey: 'count', color: '#8b5cf6', name: 'Count' }]}
          xAxisKey="age_group"
          loading={loading}
        />
      </div>

      <DataTable
        title="Hospitalization Trend Records"
        data={data}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'clinical_status', header: 'Clinical Status' },
          { key: 'age_group', header: 'Age Group' },
          { key: 'count', header: 'Count', render: (item) => (item.count || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
