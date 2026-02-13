'use client';

import { useEffect, useState } from 'react';
import { Syringe, RefreshCw } from 'lucide-react';
import { StatCard, LineChartCard, DataTable, BarChartCard, PieChartCard } from '@/components';
import { apiService, VaccinationProgress, VaccinationByAge, VaccinationUptakeTrend } from '@/lib/api';

export default function VaccinationPage() {
  const [data, setData] = useState<VaccinationProgress[]>([]);
  const [byAge, setByAge] = useState<VaccinationByAge[]>([]);
  const [uptakeTrend, setUptakeTrend] = useState<VaccinationUptakeTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressData, ageData, trendData] = await Promise.all([
        apiService.getVaccinationProgress(),
        apiService.getVaccinationByAge(),
        apiService.getVaccinationUptakeTrend(),
      ]);
      setData(progressData);
      setByAge(ageData);
      setUptakeTrend(trendData);
    } catch (error) {
      console.error('Error loading vaccination data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDoses = data.reduce((sum, r) => sum + (r.doses_administered || 0), 0);
  const totalFirstDose = data.reduce((sum, r) => sum + (r.first_dose || 0), 0);
  const totalSecondDose = data.reduce((sum, r) => sum + (r.second_dose || 0), 0);
  const totalBooster = data.reduce((sum, r) => sum + (r.booster || 0), 0);

  const progressChartData = data.slice(-30).map((r) => ({
    date: r.date || '',
    doses: r.doses_administered || 0,
    first_dose: r.first_dose || 0,
    second_dose: r.second_dose || 0,
  }));

  const uptakeChartData = uptakeTrend.map((r) => ({
    date: r.date || '',
    uptake: r.uptake || 0,
  }));

  const ageChartData = byAge.map((r) => ({
    age_group: r.age_group || 'Unknown',
    vaccinated: r.vaccinated || 0,
  }));

  const doseBreakdown = [
    { name: 'First Dose', value: totalFirstDose },
    { name: 'Second Dose', value: totalSecondDose },
    { name: 'Booster', value: totalBooster },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vaccination Data</h1>
          <p className="text-slate-500">Track vaccination progress and coverage</p>
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
        <StatCard title="Total Doses" value={totalDoses} icon={Syringe} color="green" />
        <StatCard title="First Dose" value={totalFirstDose} icon={Syringe} color="blue" />
        <StatCard title="Second Dose" value={totalSecondDose} icon={Syringe} color="purple" />
        <StatCard title="Booster" value={totalBooster} icon={Syringe} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChartCard
          title="Vaccination Progress Over Time"
          data={progressChartData}
          lines={[
            { dataKey: 'doses', color: '#10b981', name: 'Total Doses' },
            { dataKey: 'first_dose', color: '#3b82f6', name: 'First Dose' },
            { dataKey: 'second_dose', color: '#8b5cf6', name: 'Second Dose' },
          ]}
          loading={loading}
        />
        <LineChartCard
          title="Vaccination Uptake Trend"
          data={uptakeChartData}
          lines={[
            { dataKey: 'uptake', color: '#10b981', name: 'Uptake' },
          ]}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChartCard
          title="Vaccinations by Age Group"
          data={ageChartData}
          bars={[{ dataKey: 'vaccinated', color: '#10b981', name: 'Vaccinated' }]}
          xAxisKey="age_group"
          loading={loading}
        />
        <PieChartCard
          title="Dose Distribution"
          data={doseBreakdown}
          colors={['#3b82f6', '#8b5cf6', '#f59e0b']}
          loading={loading}
        />
      </div>

      <DataTable
        title="Vaccination Progress Records"
        data={data.slice(-100)}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'doses_administered', header: 'Doses', render: (item) => (item.doses_administered || 0).toLocaleString() },
          { key: 'first_dose', header: 'First Dose', render: (item) => (item.first_dose || 0).toLocaleString() },
          { key: 'second_dose', header: 'Second Dose', render: (item) => (item.second_dose || 0).toLocaleString() },
          { key: 'booster', header: 'Booster', render: (item) => (item.booster || 0).toLocaleString() },
        ]}
        loading={loading}
      />
    </div>
  );
}
