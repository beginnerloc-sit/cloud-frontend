'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface BarChartCardProps {
  title: string;
  data: Record<string, unknown>[];
  bars: {
    dataKey: string;
    color: string;
    name?: string;
  }[];
  xAxisKey?: string;
  loading?: boolean;
}

export default function BarChartCard({ 
  title, 
  data, 
  bars, 
  xAxisKey = 'region',
  loading = false 
}: BarChartCardProps) {
  if (loading) {
    return (
      <div className="medical-card p-6">
        <h3 className="medical-card-title text-lg font-semibold mb-4">{title}</h3>
        <div className="h-80 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="medical-card p-6">
      <h3 className="medical-card-title text-lg font-semibold mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d2e8d8" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#3f6a50"
              tick={{ fill: '#3f6a50', fontSize: 12 }}
            />
            <YAxis 
              stroke="#3f6a50"
              tick={{ fill: '#3f6a50', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f8fff9', 
                border: '1px solid #c9e2cf',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.color}
                name={bar.name || bar.dataKey}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
