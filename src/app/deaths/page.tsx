'use client';

import { useEffect, useState, useMemo } from 'react';
import { Skull, RefreshCw, TrendingDown, Calendar } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard } from '@/components';
import { apiService, MonthlyDeath, MonthlyDeathsResponse } from '@/lib/api';

// Month order for sorting
const monthOrder: Record<string, number> = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

function sortByMonth(a: string, b: string): number {
  const [aMonth, aYear] = a.split(' ');
  const [bMonth, bYear] = b.split(' ');
  const aYearNum = parseInt(aYear) || 0;
  const bYearNum = parseInt(bYear) || 0;
  if (aYearNum !== bYearNum) return aYearNum - bYearNum;
  return (monthOrder[aMonth] || 0) - (monthOrder[bMonth] || 0);
}

function getMonthSortKey(value: string): number {
  const [month, year] = value.split(' ');
  const yearNum = parseInt(year) || 0;
  const monthNum = monthOrder[month] || 0;
  return yearNum * 12 + monthNum;
}

function getAgeBucket(ageGroup: string): '0-11' | '12-59' | '60+' | null {
  const label = ageGroup.trim().toLowerCase();
  if (!label || label === 'unknown') return null;
  if (label.includes('+')) {
    const plusMatch = label.match(/(\d+)\s*\+/);
    if (plusMatch && parseInt(plusMatch[1], 10) >= 60) return '60+';
  }
  if (label.includes('and above')) {
    const aboveMatch = label.match(/(\d+)\s*years?\s*old\s*and\s*above/);
    if (aboveMatch && parseInt(aboveMatch[1], 10) >= 60) return '60+';
  }
  const rangeMatch = label.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    if (high <= 11) return '0-11';
    if (low >= 12 && high <= 59) return '12-59';
    if (low >= 60) return '60+';
  }
  return null;
}

export default function DeathsPage() {
  const [response, setResponse] = useState<MonthlyDeathsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getMonthlyDeaths();
      setResponse(result);
    } catch (error) {
      console.error('Error loading deaths data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract data from response
  const rawData: MonthlyDeath[] = useMemo(
    () => (Array.isArray(response?.data) ? response.data : []),
    [response?.data]
  );
  const summary = response?.summary;

  // Group deaths by month for line chart
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    rawData.forEach(r => {
      const month = r.as_of_month || 'Unknown';
      totals[month] = (totals[month] || 0) + (r.total_deaths || 0);
    });
    return Object.entries(totals)
      .map(([month, deaths]) => ({ month, deaths }))
      .sort((a, b) => sortByMonth(a.month, b.month));
  }, [rawData]);

  // Group deaths by age group for bar chart
  const ageGroupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    rawData.forEach(r => {
      const age = r.age_groups || 'Unknown';
      totals[age] = (totals[age] || 0) + (r.total_deaths || 0);
    });
    return Object.entries(totals)
      .map(([age_group, deaths]) => ({ age_group, deaths }))
      .sort((a, b) => b.deaths - a.deaths);
  }, [rawData]);

  const averageMonthlyDeathsByBucket = useMemo(() => {
    const buckets = new Map<string, { total: number; months: Set<string> }>();

    rawData.forEach(r => {
      const bucket = getAgeBucket(r.age_groups || '');
      const month = r.as_of_month || '';
      if (!bucket || !month) return;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { total: 0, months: new Set<string>() });
      }
      const entry = buckets.get(bucket);
      if (!entry) return;
      entry.total += r.total_deaths || 0;
      entry.months.add(month);
    });

    const toAverage = (bucket: string) => {
      const entry = buckets.get(bucket);
      if (!entry || entry.months.size === 0) return null;
      return entry.total / entry.months.size;
    };

    return {
      '0-11': toAverage('0-11'),
      '12-59': toAverage('12-59'),
      '60+': toAverage('60+'),
    };
  }, [rawData]);

  const formatAverage = (value: number | null) => (value === null ? 'N/A' : value.toFixed(1));

  const sortedMonths = useMemo(() => monthlyTotals.map(item => item.month), [monthlyTotals]);

  const bucketTotalsByMonth = useMemo(() => {
    const totals: Record<string, Record<string, number>> = {};
    rawData.forEach(r => {
      const bucket = getAgeBucket(r.age_groups || '');
      const month = r.as_of_month || '';
      if (!bucket || !month) return;
      if (!totals[bucket]) totals[bucket] = {};
      totals[bucket][month] = (totals[bucket][month] || 0) + (r.total_deaths || 0);
    });
    return totals;
  }, [rawData]);

  const getPreviousMonth = (month: string) => {
    const index = sortedMonths.indexOf(month);
    if (index <= 0) return null;
    return sortedMonths[index - 1];
  };

  const formatPercentChange = (current: number, previous: number | null) => {
    if (previous === null || previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const tableData = useMemo(() => {
    return [...rawData].sort((a, b) => {
      const aMonth = a.as_of_month || '';
      const bMonth = b.as_of_month || '';
      const monthCompare = sortByMonth(aMonth, bMonth);
      if (monthCompare !== 0) return monthCompare;
      return String(a.age_groups || '').localeCompare(String(b.age_groups || ''));
    });
  }, [rawData]);

  const totalDeaths = summary?.total_deaths || 0;
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deaths Data</h1>
          <p className="text-slate-500">COVID-19 mortality data by month and age group</p>
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
        <StatCard 
          title="Total Deaths" 
          value={totalDeaths.toLocaleString()} 
          icon={Skull} 
          color="red" 
        />
        <StatCard 
          title="Months Tracked" 
          value={monthlyTotals.length} 
          icon={Calendar} 
          color="purple" 
        />
        <StatCard 
          title="Age Groups" 
          value={ageGroupTotals.length} 
          icon={TrendingDown} 
          color="blue" 
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Average Monthly Deaths by Age Group</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Ages 0-11"
            value={formatAverage(averageMonthlyDeathsByBucket['0-11'])}
            icon={Skull}
            color="blue"
          />
          <StatCard
            title="Ages 12-59"
            value={formatAverage(averageMonthlyDeathsByBucket['12-59'])}
            icon={Skull}
            color="purple"
          />
          <StatCard
            title="Ages 60+"
            value={formatAverage(averageMonthlyDeathsByBucket['60+'])}
            icon={Skull}
            color="red"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Monthly Deaths Trend"
          data={monthlyTotals}
          lines={[{ dataKey: 'deaths', color: '#ef4444', name: 'Deaths' }]}
          xAxisKey="month"
          loading={loading}
        />
        <BarChartCard
          title="Deaths by Age Group"
          data={ageGroupTotals}
          bars={[{ dataKey: 'deaths', color: '#8b5cf6', name: 'Deaths' }]}
          xAxisKey="age_group"
          loading={loading}
        />
      </div>

      <DataTable
        title="Monthly Death Records by Age Group"
        data={tableData}
        columns={[
          {
            key: 'as_of_month',
            header: 'Month',
            sortAccessor: (item) => getMonthSortKey(item.as_of_month || ''),
          },
          { key: 'age_groups', header: 'Age Group' },
          {
            key: 'age_bucket',
            header: 'Age Bucket',
            render: (item) => getAgeBucket(item.age_groups || '') || 'Unknown',
          },
          { key: 'total_deaths', header: 'Deaths', render: (item) => (item.total_deaths || 0).toLocaleString() },
          {
            key: 'mom_change',
            header: 'Monthly Change',
            render: (item) => {
              const bucket = getAgeBucket(item.age_groups || '');
              const month = item.as_of_month || '';
              if (!bucket || !month) return 'N/A';
              const currentTotal = bucketTotalsByMonth[bucket]?.[month] ?? 0;
              const previousMonth = getPreviousMonth(month);
              const previousTotal = previousMonth ? (bucketTotalsByMonth[bucket]?.[previousMonth] ?? null) : null;
              return formatPercentChange(currentTotal, previousTotal);
            },
          },
        ]}
        loading={loading}
      />
    </div>
  );
}
