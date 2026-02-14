'use client';

import { useEffect, useState } from 'react';
import { Activity, RefreshCw, TrendingUp, Calendar, AlertTriangle, LineChart } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, WeeklyInfectionsResponse, InfectionTimeseriesResponse } from '@/lib/api';

const percentile = (sortedValues: number[], p: number): number => {
  if (!sortedValues.length) return 0;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

export default function InfectionsPage() {
  const [weeklyResponse, setWeeklyResponse] = useState<WeeklyInfectionsResponse | null>(null);
  const [timeseriesResponse, setTimeseriesResponse] = useState<InfectionTimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [weekly, timeseries] = await Promise.all([
        apiService.getWeeklyInfections(),
        apiService.getInfectionsTimeseries(),
      ]);
      setWeeklyResponse(weekly);
      setTimeseriesResponse(timeseries);
    } catch (error) {
      console.error('Error loading infections data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract data from responses
  const summary = weeklyResponse?.summary;
  
  // Use timeseries data for chart (already sorted by epi_week)
  const timeseriesData = Array.isArray(timeseriesResponse?.data) ? timeseriesResponse.data : [];

  const rawSeries = timeseriesData.map((r) => ({
    epi_year: r.epi_year || null,
    epi_week: r.epi_week || '',
    cases: r.est_count || 0,
  }));

  // Function 1: 4-week moving average
  const chartData = rawSeries.map((row, i) => {
    const movingAvg4 = i < 3
      ? null
      : Number((rawSeries.slice(i - 3, i + 1).reduce((sum, r) => sum + r.cases, 0) / 4).toFixed(2));
    return {
      ...row,
      moving_avg_4: movingAvg4,
    };
  });

  // Function 2: Week-on-week growth analysis
  const growthData = chartData.map((row, i) => {
    if (i === 0) return { ...row, wow_growth_pct: 0 };
    const prev = chartData[i - 1].cases;
    const growth = prev === 0 ? 0 : ((row.cases - prev) / prev) * 100;
    return {
      ...row,
      wow_growth_pct: Number(growth.toFixed(2)),
    };
  });

  const maxGrowth = growthData.reduce((max, row) => (
    row.wow_growth_pct > max.wow_growth_pct ? row : max
  ), { epi_week: 'N/A', wow_growth_pct: Number.NEGATIVE_INFINITY } as { epi_week: string; wow_growth_pct: number });

  // Function 3: Outlier detection using IQR and z-score
  const caseValues = growthData.map((r) => r.cases);
  const sortedCases = [...caseValues].sort((a, b) => a - b);
  const q1 = percentile(sortedCases, 0.25);
  const q3 = percentile(sortedCases, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const meanCases = caseValues.length ? caseValues.reduce((sum, v) => sum + v, 0) / caseValues.length : 0;
  const variance = caseValues.length
    ? caseValues.reduce((sum, v) => sum + (v - meanCases) ** 2, 0) / caseValues.length
    : 0;
  const stdDev = Math.sqrt(variance);

  const outlierData = growthData.map((row) => {
    const zScore = stdDev === 0 ? 0 : (row.cases - meanCases) / stdDev;
    const isIqrOutlier = row.cases < lowerFence || row.cases > upperFence;
    const isZOutlier = Math.abs(zScore) >= 2;
    return {
      ...row,
      z_score: Number(zScore.toFixed(2)),
      upper_iqr_fence: Number(upperFence.toFixed(2)),
      lower_iqr_fence: Number(lowerFence.toFixed(2)),
      is_outlier: isIqrOutlier || isZOutlier,
      outlier_flag: isIqrOutlier || isZOutlier ? 1 : 0,
    };
  });

  const anomalyCount = outlierData.filter((r) => r.is_outlier).length;
  const outlierWeeks = outlierData.filter((r) => r.is_outlier);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infections Data</h1>
          <p className="text-slate-500">COVID-19 infection cases by epidemiological week</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard 
          title="Total Infections" 
          value={(summary?.total_infections || 0).toLocaleString()} 
          icon={Activity} 
          color="red" 
        />
        <StatCard 
          title="Average Weekly" 
          value={(summary?.average_weekly || 0).toLocaleString()} 
          icon={TrendingUp} 
          color="blue" 
        />
        <StatCard 
          title="Total Records" 
          value={summary?.total_records || 0} 
          icon={Calendar} 
          color="green" 
        />
        <StatCard
          title="Peak WoW Growth"
          value={Number.isFinite(maxGrowth.wow_growth_pct) ? `${maxGrowth.wow_growth_pct.toFixed(2)}%` : '0.00%'}
          icon={LineChart}
          color="purple"
        />
        <StatCard
          title="Anomaly Weeks"
          value={anomalyCount}
          icon={AlertTriangle}
          color="yellow"
        />
      </div>

      <div className="mb-8">
        <LineChartCard
          title={(timeseriesResponse?.title || "COVID-19 Infections by Epi-week") + ' + MA(4)'}
          data={outlierData}
          lines={[
            { dataKey: 'cases', color: '#ef4444', name: 'Cases' },
            { dataKey: 'moving_avg_4', color: '#2563eb', name: '4-Week Moving Avg' },
          ]}
          xAxisKey="epi_week"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartCard
          title="Week-on-Week Growth Rate (%)"
          data={outlierData.slice(1)}
          bars={[{ dataKey: 'wow_growth_pct', color: '#0ea5e9', name: 'WoW Growth %' }]}
          xAxisKey="epi_week"
          loading={loading}
        />
        <LineChartCard
          title="Outlier Detection (IQR Fences + Cases)"
          data={outlierData}
          lines={[
            { dataKey: 'cases', color: '#ef4444', name: 'Cases' },
            { dataKey: 'upper_iqr_fence', color: '#f59e0b', name: 'Upper IQR Fence' },
            { dataKey: 'lower_iqr_fence', color: '#f59e0b', name: 'Lower IQR Fence' },
          ]}
          xAxisKey="epi_week"
          loading={loading}
        />
      </div>

      <DataTable
        title="Weekly Infection Records"
        data={outlierData}
        columns={[
          { key: 'epi_year', header: 'Year' },
          { key: 'epi_week', header: 'Epi Week' },
          { key: 'cases', header: 'Estimated Cases', render: (item) => (item.cases || 0).toLocaleString() },
          { key: 'moving_avg_4', header: 'MA(4)', render: (item) => item.moving_avg_4 == null ? '-' : Number(item.moving_avg_4).toLocaleString() },
          { key: 'wow_growth_pct', header: 'WoW Growth %', render: (item) => `${Number(item.wow_growth_pct || 0).toFixed(2)}%` },
          { key: 'z_score', header: 'Z-Score', render: (item) => Number(item.z_score || 0).toFixed(2) },
          { key: 'is_outlier', header: 'Outlier?', render: (item) => item.is_outlier ? 'Yes' : 'No' },
        ]}
        loading={loading}
      />

      {!loading && outlierWeeks.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Detected anomaly weeks ({outlierWeeks.length})</p>
          <p>
            {outlierWeeks.map((r) => `${r.epi_week} (${r.cases.toLocaleString()})`).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
