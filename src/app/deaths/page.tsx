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
        data={rawData}
        columns={[
          { key: 'as_of_month', header: 'Month' },
          { key: 'age_groups', header: 'Age Group' },
          { key: 'total_deaths', header: 'Deaths', render: (item) => (item.total_deaths || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
