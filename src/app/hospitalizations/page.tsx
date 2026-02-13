'use client';

import { useEffect, useState } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, HospitalizationRecord } from '@/lib/api';

export default function HospitalizationsPage() {
  const [data, setData] = useState<HospitalizationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getHospitalizations();
      setData(result);
    } catch (error) {
      console.error('Error loading hospitalizations data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalHospitalizations = data.reduce((sum, r) => sum + (r.hospitalizations || 0), 0);
  const totalDischarged = data.reduce((sum, r) => sum + (r.discharged || 0), 0);
  const currentPatients = data.reduce((sum, r) => sum + (r.current_patients || 0), 0);

  const chartData = data.slice(-30).map((r) => ({
    date: r.date,
    hospitalizations: r.hospitalizations,
    discharged: r.discharged || 0,
    current: r.current_patients || 0,
  }));

  const regionData = data.reduce((acc: Record<string, number>, r) => {
    acc[r.region] = (acc[r.region] || 0) + r.hospitalizations;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData)
    .map(([region, hospitalizations]) => ({ region, hospitalizations }))
    .sort((a, b) => b.hospitalizations - a.hospitalizations)
    .slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospitalizations Data</h1>
          <p className="text-slate-500">Monitor hospital admissions and discharges</p>
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
        <StatCard title="Total Hospitalizations" value={totalHospitalizations} icon={Building2} color="blue" />
        <StatCard title="Discharged" value={totalDischarged} icon={Building2} color="green" />
        <StatCard title="Current Patients" value={currentPatients} icon={Building2} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Hospitalization Trends Over Time"
          data={chartData}
          lines={[
            { dataKey: 'hospitalizations', color: '#3b82f6', name: 'New Admissions' },
            { dataKey: 'discharged', color: '#10b981', name: 'Discharged' },
            { dataKey: 'current', color: '#f59e0b', name: 'Current Patients' },
          ]}
          loading={loading}
        />
        <BarChartCard
          title="Hospitalizations by Region"
          data={regionChartData}
          bars={[{ dataKey: 'hospitalizations', color: '#3b82f6', name: 'Total' }]}
          xAxisKey="region"
          loading={loading}
        />
      </div>

      <DataTable
        title="Hospitalization Records"
        data={data.slice(-100)}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'region', header: 'Region' },
          { key: 'hospitalizations', header: 'Admissions', render: (item) => item.hospitalizations.toLocaleString() },
          { key: 'discharged', header: 'Discharged', render: (item) => (item.discharged || 0).toLocaleString() },
          { key: 'current_patients', header: 'Current', render: (item) => (item.current_patients || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
