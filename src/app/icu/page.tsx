'use client';

import { useEffect, useState, useMemo } from 'react';
import { Heart, RefreshCw, Bed, Activity } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, PieChartCard } from '@/components';
import { apiService, ICUUtilization, ICUUtilizationResponse } from '@/lib/api';

export default function ICUPage() {
  const buildStats = (values: number[]) => {
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((sum, v) => sum + v, 0) / n;
    const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[n - 1];

    const percentile = (p: number) => {
      if (n === 1) return sorted[0];
      const idx = (n - 1) * p;
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      if (lower === upper) return sorted[lower];
      const weight = idx - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const median = percentile(0.5);
    const p25 = percentile(0.25);
    const p50 = median;
    const p75 = percentile(0.75);

    return { stdDev, median, p25, p50, p75, min, max };
  };

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
  const rawData: ICUUtilization[] = useMemo(
    () => (Array.isArray(response?.data) ? response.data : []),
    [response?.data]
  );

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

  const covidBedValues = useMemo(() => {
    return rawData
      .filter(r => r.status?.toLowerCase() === 'covid')
      .map(r => r.avg_beds || 0);
  }, [rawData]);

  const nonCovidBedValues = useMemo(() => {
    return rawData
      .filter(r => r.status?.toLowerCase() === 'non-covid')
      .map(r => r.avg_beds || 0);
  }, [rawData]);

  const emptyBedValues = useMemo(() => {
    return rawData
      .filter(r => r.status?.toLowerCase() === 'empty')
      .map(r => r.avg_beds || 0);
  }, [rawData]);

  const covidStats = useMemo(() => buildStats(covidBedValues), [covidBedValues]);
  const nonCovidStats = useMemo(() => buildStats(nonCovidBedValues), [nonCovidBedValues]);
  const emptyStats = useMemo(() => buildStats(emptyBedValues), [emptyBedValues]);

  const formatStat = (stats: ReturnType<typeof buildStats>, value: number) =>
    (stats ? value.toFixed(1) : 'N/A');
  const formatRange = (stats: ReturnType<typeof buildStats>, min: number, max: number) =>
    (stats ? `${min.toFixed(1)} - ${max.toFixed(1)}` : 'N/A');

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
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

      <div className="mb-8 mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">COVID Beds Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Min/Max"
            value={formatRange(covidStats, covidStats?.min || 0, covidStats?.max || 0)}
            icon={Heart}
            color="red"
            allowWrap
          />
          <StatCard
            title="Std Dev"
            value={formatStat(covidStats, covidStats?.stdDev || 0)}
            icon={Heart}
            color="red"
          />
          <StatCard
            title="Median"
            value={formatStat(covidStats, covidStats?.median || 0)}
            icon={Heart}
            color="red"
          />
          <StatCard
            title="25th Percentile"
            value={formatStat(covidStats, covidStats?.p25 || 0)}
            icon={Heart}
            color="red"
          />
          <StatCard
            title="50th Percentile"
            value={formatStat(covidStats, covidStats?.p50 || 0)}
            icon={Heart}
            color="red"
          />
          <StatCard
            title="75th Percentile"
            value={formatStat(covidStats, covidStats?.p75 || 0)}
            icon={Heart}
            color="red"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Non-COVID Beds Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Min/Max"
            value={formatRange(nonCovidStats, nonCovidStats?.min || 0, nonCovidStats?.max || 0)}
            icon={Bed}
            color="yellow"
            allowWrap
          />
          <StatCard
            title="Std Dev"
            value={formatStat(nonCovidStats, nonCovidStats?.stdDev || 0)}
            icon={Bed}
            color="yellow"
          />
          <StatCard
            title="Median"
            value={formatStat(nonCovidStats, nonCovidStats?.median || 0)}
            icon={Bed}
            color="yellow"
          />
          <StatCard
            title="25th Percentile"
            value={formatStat(nonCovidStats, nonCovidStats?.p25 || 0)}
            icon={Bed}
            color="yellow"
          />
          <StatCard
            title="50th Percentile"
            value={formatStat(nonCovidStats, nonCovidStats?.p50 || 0)}
            icon={Bed}
            color="yellow"
          />
          <StatCard
            title="75th Percentile"
            value={formatStat(nonCovidStats, nonCovidStats?.p75 || 0)}
            icon={Bed}
            color="yellow"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Empty Beds Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Min/Max"
            value={formatRange(emptyStats, emptyStats?.min || 0, emptyStats?.max || 0)}
            icon={Bed}
            color="green"
            allowWrap
          />
          <StatCard
            title="Std Dev"
            value={formatStat(emptyStats, emptyStats?.stdDev || 0)}
            icon={Bed}
            color="green"
          />
          <StatCard
            title="Median"
            value={formatStat(emptyStats, emptyStats?.median || 0)}
            icon={Bed}
            color="green"
          />
          <StatCard
            title="25th Percentile"
            value={formatStat(emptyStats, emptyStats?.p25 || 0)}
            icon={Bed}
            color="green"
          />
          <StatCard
            title="50th Percentile"
            value={formatStat(emptyStats, emptyStats?.p50 || 0)}
            icon={Bed}
            color="green"
          />
          <StatCard
            title="75th Percentile"
            value={formatStat(emptyStats, emptyStats?.p75 || 0)}
            icon={Bed}
            color="green"
          />

        </div>
      </div>
    </div>
  );
}
