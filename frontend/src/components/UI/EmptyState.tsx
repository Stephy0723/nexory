import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#161B22] border border-[#21262D] flex items-center justify-center mb-4">
        <Icon size={22} className="text-[#484F58]" />
      </div>
      <h3 className="text-sm font-medium text-[#E6EDF3] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#8B949E] mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}