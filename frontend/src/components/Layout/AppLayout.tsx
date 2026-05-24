import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AIButton } from '@/components/ai/AIButton';
import { AIPanel } from '@/components/ai/AIPanel';
import { HelpButton } from '@/components/help/HelpButton';
import { HelpPanel } from '@/components/help/HelpPanel';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#080B12]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Fixed overlays */}
      <AIPanel />
      <HelpPanel />
      <AIButton />
      <HelpButton />
    </div>
  );
}