import React from 'react';
import { CheckCircle, X, Zap } from 'lucide-react';
import type { AIAction } from '@/store/aiStore';
import { useAI } from '@/hooks/useAI';
import toast from 'react-hot-toast';

const ACTION_ICONS: Record<string, string> = {
  UPDATE_PROJECT: '✏️',
  ADD_STACK: '⚡',
  CREATE_TASK: '✅',
  CREATE_CREDENTIAL: '🔑',
  CREATE_NOTE: '📝',
  CREATE_DB: '🗄️',
  UPDATE_TASK: '🔄',
  BULK_UPDATE: '📦',
};

interface Props {
  actions: AIAction[];
  msgId: string;
  applied: boolean;
  onCancel: () => void;
}

export function AIPreviewChanges({ actions, msgId, applied, onCancel }: Props) {
  const { applyChanges } = useAI();
  const [loading, setLoading] = React.useState(false);

  async function handleApply() {
    setLoading(true);
    const ok = await applyChanges(actions, msgId);
    setLoading(false);
    if (ok) {
      toast.success(`✓ ${actions.length} change${actions.length > 1 ? 's' : ''} applied`);
    } else {
      toast.error('Failed to apply changes');
    }
  }

  if (applied) {
    return (
      <div className="mt-3 flex items-center gap-2 text-[#22C55E] text-xs">
        <CheckCircle size={13} /> Changes applied successfully
      </div>
    );
  }

  return (
    <div className="mt-3 bg-[#0D1117] border-l-[3px] border-[#39D0D8] rounded-r-md p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap size={12} className="text-[#39D0D8]" />
        <span className="text-[11px] font-mono font-semibold text-[#39D0D8] uppercase tracking-wider">Proposed Changes</span>
      </div>
      <div className="space-y-1.5 mb-3">
        {actions.map((action, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-sm">{ACTION_ICONS[action.type] || '🔧'}</span>
            <span className="text-[#C9D1D9] flex-1">{action.description || action.type}</span>
            {action.projectName && (
              <span className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px] text-[#8B949E]">{action.projectName}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-[#8B949E] hover:text-[#C9D1D9] border border-[#21262D] rounded transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.3)] rounded hover:bg-[rgba(34,197,94,0.25)] transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <CheckCircle size={11} />
          {loading ? 'Applying...' : `Apply Changes`}
        </button>
      </div>
    </div>
  );
}
