'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface PieChartCardProps {
  title: string;
  data: { name: string; value: number }[];
  colors?: string[];
  loading?: boolean;
}

const DEFAULT_COLORS = ['#1f7a4b', '#2e8f5e', '#5ab079', '#74c491', '#3b9b67', '#a7ddbc'];

export default function PieChartCard({ 
  title, 
  data, 
  colors = DEFAULT_COLORS,
  loading = false 
}: PieChartCardProps) {
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f8fff9', 
                border: '1px solid #c9e2cf',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
