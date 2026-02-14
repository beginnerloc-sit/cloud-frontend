'use client';

import { useEffect, useState, useMemo } from 'react';
import { Building2, RefreshCw, Activity, Users } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard, PieChartCard, HeatmapChart } from '@/components';
import { apiService, HospitalizationTrend, HospitalizationTrendResponse, HospitalizationHeatmap } from '@/lib/api';

export default function HospitalizationsPage() {
  const [data, setData] = useState<HospitalizationTrend[]>([]);
  const [summary, setSummary] = useState<HospitalizationTrendResponse['summary']>();
  const [heatmapData, setHeatmapData] = useState<HospitalizationHeatmap | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trendResponse, heatmap] = await Promise.all([
        apiService.getHospitalizationTrend(),
        apiService.getHospitalizationHeatmap(),
      ]);
      setData(trendResponse.data || []);
      setSummary(trendResponse.summary);
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

  // Ensure data is always an array
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Total cases from summary or calculated
  const totalCases = summary?.total_cases || safeData.reduce((sum, r) => sum + (r.total_count || 0), 0);

  // Group by clinical status
  const statusData = useMemo(() => {
    const totals: Record<string, number> = {};
    safeData.forEach(r => {
      const status = r.clinical_status || 'Unknown';
      totals[status] = (totals[status] || 0) + (r.total_count || 0);
    });
    return Object.entries(totals)
      .map(([status, count]) => ({ status, count: Math.round(count * 10) / 10 }))
      .sort((a, b) => b.count - a.count);
  }, [safeData]);

  // Group by age group
  const ageData = useMemo(() => {
    const totals: Record<string, number> = {};
    safeData.forEach(r => {
      const age = r.age_groups || 'Unknown';
      totals[age] = (totals[age] || 0) + (r.total_count || 0);
    });
    return Object.entries(totals)
      .map(([age_group, count]) => ({ age_group, count: Math.round(count * 10) / 10 }))
      .sort((a, b) => b.count - a.count);
  }, [safeData]);

  // Timeline by epi_week - aggregate all statuses and ages per week
  const timelineData = useMemo(() => {
    const weeklyTotals: Record<string, { hospitalised: number; icu: number }> = {};
    safeData.forEach(r => {
      const week = r.epi_week || '';
      if (!weeklyTotals[week]) {
        weeklyTotals[week] = { hospitalised: 0, icu: 0 };
      }
      if (r.clinical_status?.toLowerCase() === 'icu') {
        weeklyTotals[week].icu += r.total_count || 0;
      } else {
        weeklyTotals[week].hospitalised += r.total_count || 0;
      }
    });
    return Object.entries(weeklyTotals)
      .map(([epi_week, { hospitalised, icu }]) => ({
        epi_week,
        Hospitalised: Math.round(hospitalised * 10) / 10,
        ICU: Math.round(icu * 10) / 10,
      }))
      .sort((a, b) => a.epi_week.localeCompare(b.epi_week));
  }, [safeData]);

  // Status distribution for pie chart
  const statusPieData = statusData.map(s => ({ name: s.status, value: s.count }));

  // Outlier detection by week using IQR on total weekly hospitalizations
  const outlierWeekData = useMemo(() => {
    const totals = timelineData.map((w) => ({
      epi_week: w.epi_week,
      total: Number((w.Hospitalised || 0) + (w.ICU || 0)),
    }));

    const sortedTotals = totals.map((t) => t.total).sort((a, b) => a - b);
    if (sortedTotals.length === 0) return [];

    const percentile = (arr: number[], p: number): number => {
      const idx = (arr.length - 1) * p;
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return arr[lo];
      const weight = idx - lo;
      return arr[lo] * (1 - weight) + arr[hi] * weight;
    };

    const q1 = percentile(sortedTotals, 0.25);
    const q3 = percentile(sortedTotals, 0.75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    return totals.map((t) => ({
      epi_week: t.epi_week,
      total: Number(t.total.toFixed(1)),
      upper_iqr_fence: Number(upperFence.toFixed(1)),
      lower_iqr_fence: Number(lowerFence.toFixed(1)),
      is_outlier: t.total < lowerFence || t.total > upperFence ? 1 : 0,
    }));
  }, [timelineData]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Cases" 
          value={totalCases.toFixed(1)} 
          icon={Building2} 
          color="blue" 
        />
        <StatCard 
          title="Weeks Tracked" 
          value={timelineData.length} 
          icon={Activity} 
          color="green" 
        />
        <StatCard 
          title="Clinical Statuses" 
          value={statusData.length} 
          icon={Building2} 
          color="purple" 
        />
        <StatCard 
          title="Age Groups" 
          value={ageData.length} 
          icon={Users} 
          color="yellow" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Weekly Hospitalization Trends"
          data={timelineData}
          lines={[
            { dataKey: 'Hospitalised', color: '#3b82f6', name: 'Hospitalised' },
            { dataKey: 'ICU', color: '#ef4444', name: 'ICU' },
          ]}
          xAxisKey="epi_week"
          loading={loading}
        />
        <PieChartCard
          title="By Clinical Status"
          data={statusPieData}
          colors={['#3b82f6', '#ef4444']}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartCard
          title="By Age Group"
          data={ageData}
          bars={[{ dataKey: 'count', color: '#8b5cf6', name: 'Cases' }]}
          xAxisKey="age_group"
          loading={loading}
        />
        <LineChartCard
          title="Outlier Weeks Detection (IQR)"
          data={outlierWeekData}
          lines={[
            { dataKey: 'total', color: '#ef4444', name: 'Weekly Total' },
            { dataKey: 'upper_iqr_fence', color: '#f59e0b', name: 'Upper IQR Fence' },
            { dataKey: 'lower_iqr_fence', color: '#f59e0b', name: 'Lower IQR Fence' },
          ]}
          xAxisKey="epi_week"
          loading={loading}
        />
      </div>

      {/* Heatmap */}
      <div className="mb-8">
        <HeatmapChart
          title={heatmapData?.title || "Hospitalizations by Week and Age Group"}
          xLabels={heatmapData?.x_labels || []}
          yLabels={heatmapData?.y_labels || []}
          data={heatmapData?.data_matrix || []}
          loading={loading}
        />
      </div>

      <DataTable
        title="Hospitalization Records"
        data={safeData}
        columns={[
          { key: 'epi_week', header: 'Epi Week' },
          { key: 'epi_year', header: 'Year' },
          { key: 'clinical_status', header: 'Clinical Status' },
          { key: 'age_groups', header: 'Age Group' },
          { key: 'total_count', header: 'Count', render: (item) => (item.total_count || 0).toFixed(1) },
        ]}
        loading={loading}
      />
    </div>
  );
}
