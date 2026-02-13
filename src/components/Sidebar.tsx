'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Skull, 
  Heart, 
  Syringe, 
  Building2, 
  Hospital, 
  Upload 
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/infections', label: 'Infections', icon: Activity },
  { href: '/deaths', label: 'Deaths', icon: Skull },
  { href: '/icu', label: 'ICU', icon: Heart },
  { href: '/vaccination', label: 'Vaccination', icon: Syringe },
  { href: '/hospitalizations', label: 'Hospitalizations', icon: Building2 },
  { href: '/clinics', label: 'Clinics', icon: Hospital },
  { href: '/upload', label: 'Upload Data', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 fixed left-0 top-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-blue-400">Health Analytics</h1>
        <p className="text-slate-400 text-sm">Data Dashboard</p>
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
