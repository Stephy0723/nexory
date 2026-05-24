import React, { useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActivity } from '@/hooks/useActivity';
import { EmptyState } from '@/components/UI/EmptyState';
import { Spinner } from '@/components/UI/Spinner';
import { timeAgo } from '@/utils/formatters';

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'bg-[#22C55E]',
  UPDATED: 'bg-[#39D0D8]',
  DELETED: 'bg-[#EF4444]',
  LOGIN: 'bg-[#8B5CF6]',
  REVEALED: 'bg-[#F59E0B]',
};

export function ActivityPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActivity({ page, limit: 20 });

  return (
    <div className="max-w-3xl mx-auto">
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="text-[#39D0D8]" /></div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Activity} title="No activity yet" description="Actions you take will appear here." />
      ) : (
        <>
          <div className="space-y-0 card overflow-hidden">
            {data.data.map((log, i) => (
              <div key={log.id} className={`flex gap-4 p-4 ${i !== 0 ? 'border-t border-[#21262D]' : ''}`}>
                <div className="relative flex flex-col items-center shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-[#484F58]'}`} />
                  {i !== data.data.length - 1 && <div className="w-px flex-1 bg-[#21262D] mt-1" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[#E6EDF3]">{log.action}</span>
                    <span className="text-xs text-[#8B949E]">{log.entity}</span>
                    {log.entityName && <span className="text-xs font-medium text-[#39D0D8] truncate">{log.entityName}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#484F58]">
                    <span>{log.user?.username ?? 'System'}</span>
                    <span>·</span>
                    <span>{timeAgo(log.createdAt)}</span>
                    {log.project && <><span>·</span><span className="text-[#8B949E]">{log.project.name}</span></>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <button className="btn-secondary py-1.5 px-3" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-[#8B949E]">Page {page} of {data.pagination.pages}</span>
              <button className="btn-secondary py-1.5 px-3" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.pages}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}