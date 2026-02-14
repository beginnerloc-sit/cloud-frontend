'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Skull, 
  Heart, 
  Syringe, 
  Building2, 
  Hospital, 
  Upload,
  Menu,
  X
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div>
          <h1 className="text-base font-bold text-slate-900">Health Analytics</h1>
          <p className="text-xs text-slate-500">Data Dashboard</p>
        </div>
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {mobileOpen && (
        <button
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close navigation overlay"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 p-4 text-white transition-transform duration-200 md:z-30 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8">
          <h1 className="text-xl font-bold text-blue-400">Health Analytics</h1>
          <p className="text-sm text-slate-400">Data Dashboard</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
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
    </>
  );
}
