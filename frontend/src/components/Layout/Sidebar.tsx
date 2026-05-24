import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, KeyRound, CheckSquare, StickyNote, Database, Activity, LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/credentials', icon: KeyRound, label: 'Credentials' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/database', icon: Database, label: 'Database' },
  { to: '/activity', icon: Activity, label: 'Activity' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-16 lg:w-56 flex flex-col bg-[#0D1117] border-r border-[#21262D] shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#21262D]">
        <div className="w-7 h-7 rounded-lg bg-[#39D0D8] flex items-center justify-center shrink-0">
          <Zap size={14} className="text-[#080B12]" />
        </div>
        <span className="hidden lg:block text-sm font-bold text-[#E6EDF3] tracking-wide">NEXORY</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[rgba(57,208,216,0.12)] text-[#39D0D8]'
                  : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3]'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[#21262D]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-[rgba(57,208,216,0.15)] flex items-center justify-center shrink-0 text-xs font-bold text-[#39D0D8]">
            {user?.username?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="text-xs font-medium text-[#E6EDF3] truncate">{user?.username}</span>
            <span className="text-[10px] text-[#484F58] truncate">{user?.email}</span>
          </div>
          <button onClick={logout} className="ml-auto hidden lg:flex text-[#484F58] hover:text-[#EF4444] transition-colors p-1" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}