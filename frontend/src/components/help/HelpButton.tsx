import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAIStore } from '@/store/aiStore';

export function HelpButton() {
  const { isHelpOpen, setHelpOpen } = useAppStore();
  const { setPanel } = useAIStore();

  function handleClick() {
    setPanel(false);
    setHelpOpen(!isHelpOpen);
  }

  return (
    <div className="fixed bottom-[96px] right-7 z-[9999] group">
      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 bg-[#161B22] border border-[#21262D] rounded text-[11px] text-[#C9D1D9] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Page Guide
      </div>

      <button
        onClick={handleClick}
        aria-label="Page Guide"
        className={`w-11 h-11 rounded-full bg-[#161B22] border flex items-center justify-center transition-all duration-200 ${isHelpOpen ? 'border-[#A78BFA] text-[#A78BFA]' : 'border-[#21262D] text-[#484F58] hover:border-[#A78BFA] hover:text-[#A78BFA]'}`}
      >
        <HelpCircle size={16} />
      </button>
    </div>
  );
}
