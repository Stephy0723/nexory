import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, KeyRound, CheckSquare, StickyNote, Database, ArrowRight, Clock } from 'lucide-react';
import { useProjects, useProjectStats } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useActivity } from '@/hooks/useActivity';
import { Badge } from '@/components/UI/Badge';
import { Spinner } from '@/components/UI/Spinner';
import { statusLabel, statusColor, priorityLabel, priorityColor, timeAgo } from '@/utils/formatters';

function StatCard({ icon: Icon, label, value, color, to }: { icon: React.ElementType; label: string; value: number | undefined; color: string; to: string }) {
  return (
    <Link to={to} className="card p-5 flex items-center gap-4 hover:border-[#39D0D8] transition-colors group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#E6EDF3]">{value ?? '—'}</p>
        <p className="text-xs text-[#8B949E]">{label}</p>
      </div>
      <ArrowRight size={14} className="ml-auto text-[#484F58] group-hover:text-[#39D0D8] transition-colors" />
    </Link>
  );
}

export function Dashboard() {
  const { data: projects, isLoading: pLoad } = useProjects();
  const { data: stats } = useProjectStats();
  const { data: tasks } = useTasks({ status: 'IN_PROGRESS' });
  const { data: activity } = useActivity({ limit: 8 });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={projects?.length} color="bg-[rgba(57,208,216,0.12)] text-[#39D0D8]" to="/projects" />
        <StatCard icon={CheckSquare} label="In Progress" value={stats?.openTasks} color="bg-[rgba(245,158,11,0.1)] text-[#F59E0B]" to="/tasks" />
        <StatCard icon={KeyRound} label="Credentials" value={stats?.totalCredentials} color="bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]" to="/credentials" />
        <StatCard icon={StickyNote} label="Active Projects" value={stats?.byStatus?.ACTIVE} color="bg-[rgba(34,197,94,0.1)] text-[#22C55E]" to="/projects" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#E6EDF3]">Recent Projects</h2>
            <Link to="/projects" className="text-xs text-[#39D0D8] hover:underline">View all</Link>
          </div>
          {pLoad ? (
            <div className="flex justify-center py-8"><Spinner className="text-[#39D0D8]" /></div>
          ) : (
            <div className="space-y-2">
              {projects?.slice(0, 5).map((p) => (
                <Link key={p.id} to={`/projects?view=${p.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#161B22] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#E6EDF3] truncate">{p.name}</p>
                    <p className="text-xs text-[#8B949E] truncate">{p.category ?? 'No category'}</p>
                  </div>
                  <Badge label={statusLabel(p.status)} color={p.status === 'ACTIVE' ? 'green' : p.status === 'IN_DEVELOPMENT' ? 'cyan' : p.status === 'PAUSED' ? 'amber' : 'muted'} />
                  <Badge label={priorityLabel(p.priority)} color={p.priority === 'CRITICAL' || p.priority === 'HIGH' ? 'red' : p.priority === 'MEDIUM' ? 'amber' : 'muted'} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#E6EDF3]">Activity</h2>
            <Link to="/activity" className="text-xs text-[#39D0D8] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {activity?.data?.slice(0, 8).map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#39D0D8] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#E6EDF3] leading-relaxed">
                    <span className="text-[#8B949E]">{log.action}</span>{' '}
                    <span className="font-medium">{log.entityName ?? log.entity}</span>
                  </p>
                  <p className="text-[10px] text-[#484F58] mt-0.5 flex items-center gap-1">
                    <Clock size={9} />{timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* In-Progress Tasks */}
      {tasks && tasks.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#E6EDF3]">In-Progress Tasks</h2>
            <Link to="/tasks" className="text-xs text-[#39D0D8] hover:underline">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tasks.slice(0, 6).map((t) => (
              <div key={t.id} className="p-3 rounded-lg bg-[#161B22] border border-[#21262D]">
                <p className="text-sm font-medium text-[#E6EDF3] mb-1 truncate">{t.title}</p>
                <div className="flex items-center gap-2">
                  {t.project && <span className="text-xs text-[#8B949E] truncate">{t.project.name}</span>}
                  <Badge label={priorityLabel(t.priority)} size="xs" color={t.priority === 'HIGH' || t.priority === 'CRITICAL' ? 'red' : t.priority === 'MEDIUM' ? 'amber' : 'muted'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}