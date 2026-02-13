'use client';

import { useEffect, useState } from 'react';
import { Hospital, RefreshCw, MapPin } from 'lucide-react';
import { StatCard, DataTable, PieChartCard, BarChartCard } from '@/components';
import { apiService, ClinicRecord } from '@/lib/api';

export default function ClinicsPage() {
  const [data, setData] = useState<ClinicRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getClinics();
      setData(result);
    } catch (error) {
      console.error('Error loading clinics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalClinics = data.length;
  const totalCapacity = data.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const regions = new Set(data.map(r => r.region)).size;

  // Group by region
  const regionData = data.reduce((acc: Record<string, number>, r) => {
    acc[r.region] = (acc[r.region] || 0) + 1;
    return acc;
  }, {});

  const regionChartData = Object.entries(regionData)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  // Group by type
  const typeData = data.reduce((acc: Record<string, number>, r) => {
    const type = r.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typePieData = Object.entries(typeData).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinics Data</h1>
          <p className="text-slate-500">View clinic locations and capacity</p>
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
        <StatCard title="Total Clinics" value={totalClinics} icon={Hospital} color="blue" />
        <StatCard title="Total Capacity" value={totalCapacity} icon={Hospital} color="green" />
        <StatCard title="Regions Covered" value={regions} icon={MapPin} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartCard
          title="Clinics by Region"
          data={regionChartData}
          bars={[{ dataKey: 'count', color: '#3b82f6', name: 'Clinics' }]}
          xAxisKey="region"
          loading={loading}
        />
        <PieChartCard
          title="Clinics by Type"
          data={typePieData}
          loading={loading}
        />
      </div>

      <DataTable
        title="Clinic Directory"
        data={data}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'region', header: 'Region' },
          { key: 'address', header: 'Address', render: (item) => item.address || 'N/A' },
          { key: 'type', header: 'Type', render: (item) => item.type || 'N/A' },
          { key: 'capacity', header: 'Capacity', render: (item) => (item.capacity || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
