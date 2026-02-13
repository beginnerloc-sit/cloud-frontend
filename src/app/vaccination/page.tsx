'use client';

import { useEffect, useState } from 'react';
import { Syringe, RefreshCw, Users, Shield, CheckCircle } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, PieChartCard, BarChartCard } from '@/components';
import { apiService, VaccinationProgress, VaccinationProgressResponse, VaccinationByAge, VaccinationByAgeResponse } from '@/lib/api';

export default function VaccinationPage() {
  const [data, setData] = useState<VaccinationProgress[]>([]);
  const [summary, setSummary] = useState<VaccinationProgressResponse['summary']>();
  const [byAgeData, setByAgeData] = useState<VaccinationByAge[]>([]);
  const [byAgeSummary, setByAgeSummary] = useState<VaccinationByAgeResponse['summary']>();
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressResponse, byAgeResponse] = await Promise.all([
        apiService.getVaccinationProgress(),
        apiService.getVaccinationByAge(),
      ]);
      setData(progressResponse.data || []);
      setSummary(progressResponse.summary);
      setByAgeData(byAgeResponse.data || []);
      setByAgeSummary(byAgeResponse.summary);
    } catch (error) {
      console.error('Error loading vaccination data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ensure data is always an array and sort by date
  const safeData = Array.isArray(data) ? [...data].sort((a, b) => 
    (a.vacc_date || '').localeCompare(b.vacc_date || '')
  ) : [];

  // Get latest record for summary stats
  const latestRecord = safeData.length > 0 ? safeData[safeData.length - 1] : null;

  // Progress over time chart - show last 60 days
  const progressChartData = safeData.slice(-60).map((r) => ({
    date: r.vacc_date || '',
    'At Least One Dose': r.received_at_least_one_dose || 0,
    'Full Regimen': r.full_regimen || 0,
    'Minimum Protection': r.minimum_protection || 0,
  }));

  // Uptake percentage trend chart
  const uptakeChartData = safeData.slice(-60).map((r) => ({
    date: r.vacc_date || '',
    'One Dose %': r.received_one_dose_pcttakeup || 0,
    'Full Regimen %': r.full_regimen_pcttakeup || 0,
    'Min Protection %': r.minimum_protection_pcttakeup || 0,
  }));

  // Vaccination coverage breakdown (latest data)
  const coverageData = latestRecord ? [
    { name: 'At Least One Dose', value: latestRecord.received_at_least_one_dose || 0 },
    { name: 'Full Regimen', value: latestRecord.full_regimen || 0 },
    { name: 'Minimum Protection', value: latestRecord.minimum_protection || 0 },
  ] : [];

  // Vaccination by age data - sort by age group
  const safeByAge = Array.isArray(byAgeData) ? byAgeData : [];
  const ageOrder = ['5-11', '12-17', '18-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  const sortedByAge = [...safeByAge].sort((a, b) => {
    const aIndex = ageOrder.indexOf(a.age || '');
    const bIndex = ageOrder.indexOf(b.age || '');
    return aIndex - bIndex;
  });
  
  const byAgeChartData = sortedByAge.map((r) => ({
    age: r.age || 'Unknown',
    'Protected': r.minimum_protection || 0,
    'Unprotected': r.no_minimum_protection || 0,
  }));

  // Overall protection pie chart
  const overallProtectionData = byAgeSummary ? [
    { name: 'Protected', value: byAgeSummary.overall_protected || 0 },
    { name: 'Unprotected', value: byAgeSummary.overall_unprotected || 0 },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vaccination Progress</h1>
          <p className="text-slate-500">Track vaccination coverage and uptake rates</p>
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
          title="One Dose Uptake" 
          value={`${latestRecord?.received_one_dose_pcttakeup?.toFixed(1) || 0}%`} 
          icon={Syringe} 
          color="green" 
        />
        <StatCard 
          title="Full Regimen" 
          value={`${latestRecord?.full_regimen_pcttakeup?.toFixed(1) || 0}%`} 
          icon={CheckCircle} 
          color="blue" 
        />
        <StatCard 
          title="Min Protection" 
          value={`${latestRecord?.minimum_protection_pcttakeup?.toFixed(1) || 0}%`} 
          icon={Shield} 
          color="purple" 
        />
        <StatCard 
          title="Days Tracked" 
          value={summary?.total_records || safeData.length} 
          icon={Users} 
          color="yellow" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Cumulative Vaccinations Over Time"
          data={progressChartData}
          lines={[
            { dataKey: 'At Least One Dose', color: '#10b981', name: 'At Least One Dose' },
            { dataKey: 'Full Regimen', color: '#3b82f6', name: 'Full Regimen' },
            { dataKey: 'Minimum Protection', color: '#8b5cf6', name: 'Minimum Protection' },
          ]}
          loading={loading}
        />
        <LineChartCard
          title="Vaccination Uptake Rate (%)"
          data={uptakeChartData}
          lines={[
            { dataKey: 'One Dose %', color: '#10b981', name: 'One Dose %' },
            { dataKey: 'Full Regimen %', color: '#3b82f6', name: 'Full Regimen %' },
            { dataKey: 'Min Protection %', color: '#8b5cf6', name: 'Min Protection %' },
          ]}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartCard
          title="Vaccination Protection by Age Group (%)"
          data={byAgeChartData}
          bars={[
            { dataKey: 'Protected', color: '#10b981', name: 'Protected' },
            { dataKey: 'Unprotected', color: '#ef4444', name: 'Unprotected' },
          ]}
          xAxisKey="age"
          loading={loading}
        />
        <PieChartCard
          title="Overall Protection Status"
          data={overallProtectionData}
          colors={['#10b981', '#ef4444']}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PieChartCard
          title="Latest Coverage Distribution"
          data={coverageData}
          colors={['#10b981', '#3b82f6', '#8b5cf6']}
          loading={loading}
        />
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Statistics</h3>
          {latestRecord ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Date</span>
                <span className="font-medium">{latestRecord.vacc_date}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-slate-600">Received At Least One Dose</span>
                <span className="font-medium text-green-600">
                  {(latestRecord.received_at_least_one_dose || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-slate-600">Full Regimen</span>
                <span className="font-medium text-blue-600">
                  {(latestRecord.full_regimen || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-slate-600">Minimum Protection</span>
                <span className="font-medium text-purple-600">
                  {(latestRecord.minimum_protection || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">No data available</p>
          )}
        </div>
      </div>

      <DataTable
        title="Vaccination by Age Group"
        data={sortedByAge}
        columns={[
          { key: 'age', header: 'Age Group' },
          { key: 'minimum_protection', header: 'Protected (%)', render: (item) => `${item.minimum_protection || 0}%` },
          { key: 'no_minimum_protection', header: 'Unprotected (%)', render: (item) => `${item.no_minimum_protection || 0}%` },
        ]}
        loading={loading}
      />

      <div className="mt-6">
        <DataTable
          title="Vaccination Progress Records"
          data={safeData.slice(-100).reverse()}
          columns={[
            { key: 'vacc_date', header: 'Date' },
            { key: 'received_at_least_one_dose', header: 'One Dose+', render: (item) => (item.received_at_least_one_dose || 0).toLocaleString() },
            { key: 'full_regimen', header: 'Full Regimen', render: (item) => (item.full_regimen || 0).toLocaleString() },
            { key: 'minimum_protection', header: 'Min Protection', render: (item) => (item.minimum_protection || 0).toLocaleString() },
            { key: 'received_one_dose_pcttakeup', header: 'One Dose %', render: (item) => `${item.received_one_dose_pcttakeup || 0}%` },
            { key: 'full_regimen_pcttakeup', header: 'Full %', render: (item) => `${item.full_regimen_pcttakeup || 0}%` },
            { key: 'minimum_protection_pcttakeup', header: 'Min %', render: (item) => `${item.minimum_protection_pcttakeup || 0}%` },
          ]}
          loading={loading}
        />
      </div>
    </div>
  );
}
