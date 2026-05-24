import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { useAppStore } from '@/store/appStore';

export function AIButton() {
  const { isPanelOpen, togglePanel, isProcessing } = useAIStore();
  const { setHelpOpen } = useAppStore();

  function handleClick() {
    setHelpOpen(false);
    togglePanel();
  }

  return (
    <div className="fixed bottom-7 right-7 z-[9999] group">
      {/* Tooltip */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 bg-[#161B22] border border-[#21262D] rounded text-[11px] text-[#C9D1D9] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        NEXORY AI
      </div>

      <button
        onClick={handleClick}
        aria-label="NEXORY AI Assistant"
        className="w-14 h-14 rounded-full bg-[#161B22] border-[1.5px] border-[#39D0D8] flex items-center justify-center transition-all duration-200 hover:scale-110 relative"
        style={{ boxShadow: isPanelOpen ? '0 0 28px rgba(57,208,216,0.45)' : '0 0 20px rgba(57,208,216,0.2)' }}
      >
        <Sparkles size={22} className="text-[#39D0D8]" />
        {isProcessing && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#39D0D8] animate-pulse" />
        )}
      </button>
    </div>
  );
}
