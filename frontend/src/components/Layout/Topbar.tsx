import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/credentials': 'Credentials',
  '/tasks': 'Tasks',
  '/notes': 'Notes',
  '/database': 'Database',
  '/activity': 'Activity',
};

const env = import.meta.env.VITE_APP_ENV ?? 'development';
const envConfig: Record<string, { label: string; cls: string }> = {
  development: { label: 'DEV', cls: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.25)]' },
  staging: { label: 'PRE-PROD', cls: 'bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] border-[rgba(139,92,246,0.3)]' },
  production: { label: 'PROD', cls: 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border-[rgba(34,197,94,0.25)]' },
};

export function Topbar() {
  const location = useLocation();
  const title = Object.entries(titles).find(([k]) => location.pathname.startsWith(k))?.[1] ?? 'NEXORY';
  const badge = envConfig[env] ?? envConfig.development;

  return (
    <header className="h-14 bg-[#0D1117] border-b border-[#21262D] flex items-center px-6 gap-4 shrink-0">
      <h1 className="text-sm font-semibold text-[#E6EDF3] mr-auto">{title}</h1>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
        {badge.label}
      </span>
    </header>
  );
}