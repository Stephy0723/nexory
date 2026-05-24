import React from 'react';

interface Props {
  label: string;
  color?: 'cyan' | 'violet' | 'amber' | 'green' | 'red' | 'muted';
  size?: 'xs' | 'sm';
}

const colors = {
  cyan: 'bg-[rgba(57,208,216,0.12)] text-[#39D0D8] border-[rgba(57,208,216,0.3)]',
  violet: 'bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] border-[rgba(139,92,246,0.3)]',
  amber: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.25)]',
  green: 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border-[rgba(34,197,94,0.25)]',
  red: 'bg-[rgba(239,68,68,0.1)] text-[#EF4444] border-[rgba(239,68,68,0.25)]',
  muted: 'bg-[#161B22] text-[#8B949E] border-[#21262D]',
};

export function Badge({ label, color = 'muted', size = 'sm' }: Props) {
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${colors[color]} ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      {label}
    </span>
  );
}