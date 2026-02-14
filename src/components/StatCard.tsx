'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const colorClasses = {
  blue: 'bg-[#2e8f5e]',
  green: 'bg-[#1f7a4b]',
  red: 'bg-[#3b9b67]',
  yellow: 'bg-[#5ab079]',
  purple: 'bg-[#2b8656]',
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="medical-card overflow-hidden p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
        <p className="min-w-0 text-slate-500 text-sm font-semibold uppercase tracking-wide leading-tight [overflow-wrap:anywhere]">
          {title}
        </p>
        <div className={`${colorClasses[color]} h-14 w-14 rounded-2xl shadow-md flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>

        <p className="col-span-2 whitespace-nowrap text-[clamp(1.8rem,2.5vw,2.45rem)] leading-none font-bold text-[#1b5033] tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        {trend !== undefined && (
          <p className={`col-span-2 text-sm ${trend >= 0 ? 'text-[#1f7a4b]' : 'text-[#2f6a49]'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
          </p>
        )}
      </div>
    </div>
  );
}
