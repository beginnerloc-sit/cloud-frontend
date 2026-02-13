'use client';

import { useEffect, useState, useMemo } from 'react';
import { Heart, RefreshCw, Bed, Activity } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, PieChartCard } from '@/components';
import { apiService, ICUUtilization, ICUUtilizationResponse } from '@/lib/api';

export default function ICUPage() {
  const [response, setResponse] = useState<ICUUtilizationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getICUUtilization();
      setResponse(result);
    } catch (error) {
      console.error('Error loading ICU data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract data from response
  const rawData: ICUUtilization[] = Array.isArray(response?.data) ? response.data : [];
  const summary = response?.summary;

  // Get unique epi_weeks sorted chronologically
  const sortedWeeks = useMemo(() => {
    const weeks = [...new Set(rawData.map(r => r.epi_week || ''))].filter(Boolean);
    return weeks.sort();
  }, [rawData]);

  // Aggregate by status for pie chart
  const statusTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    rawData.forEach(r => {
      const status = r.status || 'Unknown';
      totals[status] = (totals[status] || 0) + (r.avg_beds || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [rawData]);

  // Line chart data: COVID beds by week
  const chartData = useMemo(() => {
    const byWeek: Record<string, { covid: number; non_covid: number; empty: number }> = {};
    rawData.forEach(r => {
      const week = r.epi_week || '';
      if (!byWeek[week]) byWeek[week] = { covid: 0, non_covid: 0, empty: 0 };
      const status = r.status?.toLowerCase() || '';
      if (status === 'covid') byWeek[week].covid = r.avg_beds || 0;
      else if (status === 'non-covid') byWeek[week].non_covid = r.avg_beds || 0;
      else if (status === 'empty') byWeek[week].empty = r.avg_beds || 0;
    });
    return sortedWeeks.map(week => ({
      epi_week: week,
      covid: byWeek[week]?.covid || 0,
      non_covid: byWeek[week]?.non_covid || 0,
      empty: byWeek[week]?.empty || 0,
    }));
  }, [rawData, sortedWeeks]);

  // Calculate stats
  const avgCovidBeds = useMemo(() => {
    const covidData = rawData.filter(r => r.status?.toLowerCase() === 'covid');
    if (covidData.length === 0) return 0;
    return covidData.reduce((sum, r) => sum + (r.avg_beds || 0), 0) / covidData.length;
  }, [rawData]);

  const avgNonCovidBeds = useMemo(() => {
    const data = rawData.filter(r => r.status?.toLowerCase() === 'non-covid');
    if (data.length === 0) return 0;
    return data.reduce((sum, r) => sum + (r.avg_beds || 0), 0) / data.length;
  }, [rawData]);

  const avgEmptyBeds = useMemo(() => {
    const data = rawData.filter(r => r.status?.toLowerCase() === 'empty');
    if (data.length === 0) return 0;
    return data.reduce((sum, r) => sum + (r.avg_beds || 0), 0) / data.length;
  }, [rawData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ICU Utilization</h1>
          <p className="text-slate-500">ICU bed status by epidemiological week</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Weeks Tracked" 
          value={sortedWeeks.length} 
          icon={Activity} 
          color="blue" 
        />
        <StatCard 
          title="Avg COVID Beds" 
          value={avgCovidBeds.toFixed(1)} 
          icon={Heart} 
          color="red" 
        />
        <StatCard 
          title="Avg Non-COVID" 
          value={avgNonCovidBeds.toFixed(1)} 
          icon={Bed} 
          color="yellow" 
        />
        <StatCard 
          title="Avg Empty Beds" 
          value={avgEmptyBeds.toFixed(1)} 
          icon={Bed} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="ICU Bed Status Over Time"
          data={chartData}
          lines={[
            { dataKey: 'covid', color: '#ef4444', name: 'COVID' },
            { dataKey: 'non_covid', color: '#f59e0b', name: 'Non-COVID' },
            { dataKey: 'empty', color: '#10b981', name: 'Empty' },
          ]}
          xAxisKey="epi_week"
          loading={loading}
        />
        <PieChartCard
          title="Total Beds by Status"
          data={statusTotals}
          loading={loading}
        />
      </div>

      <DataTable
        title="ICU Utilization Records"
        data={rawData}
        columns={[
          { key: 'epi_year', header: 'Year' },
          { key: 'epi_week', header: 'Epi Week' },
          { key: 'status', header: 'Status' },
          { key: 'avg_beds', header: 'Avg Beds', render: (item) => (item.avg_beds || 0).toFixed(1) },
        ]}
        loading={loading}
      />
    </div>
  );
}
