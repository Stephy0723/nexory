import React, { useState } from 'react';
import { UserPlus, Trash2, Crown, Pencil, Eye, KeyRound } from 'lucide-react';
import { useProjectMembers, useInviteMember, useUpdateMember, useRemoveMember } from '@/hooks/useProjectMembers';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { ProjectMember, MemberRole } from '@/types';

interface Props {
  projectId: string;
  currentUserRole: MemberRole;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  OWNER: <Crown size={12} className="text-[#f59e0b]" />,
  EDITOR: <Pencil size={12} className="text-[#39D0D8]" />,
  VIEWER: <Eye size={12} className="text-[#8b949e]" />,
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};

const ROLE_COLOR: Record<string, string> = {
  OWNER: 'border-[#f59e0b] text-[#f59e0b] bg-[rgba(245,158,11,0.08)]',
  EDITOR: 'border-[#39D0D8] text-[#39D0D8] bg-[rgba(57,208,216,0.08)]',
  VIEWER: 'border-[#484F58] text-[#8b949e] bg-transparent',
};

export function ProjectMembers({ projectId, currentUserRole }: Props) {
  const { data, isLoading } = useProjectMembers(projectId);
  const inviteMut = useInviteMember(projectId);
  const updateMut = useUpdateMember(projectId);
  const removeMut = useRemoveMember(projectId);
  const currentUser = useAuthStore((s) => s.user);

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [canViewSecrets, setCanViewSecrets] = useState(false);

  const isOwner = currentUserRole === 'OWNER';

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      await inviteMut.mutateAsync({ username: username.trim(), role, canViewSecrets });
      toast.success(`@${username.trim()} añadido al proyecto`);
      setUsername('');
      setCanViewSecrets(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRoleChange(member: ProjectMember, newRole: 'VIEWER' | 'EDITOR') {
    try {
      await updateMut.mutateAsync({ memberId: member.id, role: newRole });
      toast.success('Rol actualizado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleSecretsToggle(member: ProjectMember) {
    try {
      await updateMut.mutateAsync({ memberId: member.id, canViewSecrets: !member.canViewSecrets });
      toast.success(member.canViewSecrets ? 'Acceso a secretos revocado' : 'Acceso a secretos concedido');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemove(member: ProjectMember) {
    const isSelf = member.userId === currentUser?.id;
    const label = isSelf ? 'Salir del proyecto' : `Eliminar a @${member.user?.username ?? ''}`;
    if (!window.confirm(`${label}?`)) return;
    try {
      await removeMut.mutateAsync(member.id);
      toast.success(isSelf ? 'Saliste del proyecto' : 'Miembro eliminado');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (isLoading) {
    return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Cargando miembros…</div>;
  }

  const owner = data?.owner;
  const members = data?.members ?? [];

  return (
    <div style={{ padding: '0 0 16px' }}>

      {/* Owner row */}
      {owner && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Propietario
          </div>
          <div className="project-drawer__item-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(57,208,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#39D0D8' }}>
                {owner.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>@{owner.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{owner.email}</div>
              </div>
            </div>
            <span className={`border text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${ROLE_COLOR.OWNER}`}>
              {ROLE_ICON.OWNER} {ROLE_LABEL.OWNER}
            </span>
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Colaboradores ({members.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {members.map((m) => {
              const isSelf = m.userId === currentUser?.id;
              return (
                <div key={m.id} className="project-drawer__item-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,148,158,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#8b949e', flexShrink: 0 }}>
                      {m.user?.username?.[0].toUpperCase() ?? '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        @{m.user?.username ?? '—'}
                        {isSelf && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>(tú)</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.user?.email}
                        {m.canViewSecrets && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f59e0b', fontSize: 10 }}>
                            <KeyRound size={9} /> Secretos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {/* Role selector (owner only) */}
                    {isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value as 'VIEWER' | 'EDITOR')}
                        style={{ background: 'var(--surface-2, #161b22)', border: '1px solid #30363d', color: 'var(--text-secondary, #8b949e)', fontSize: 11, padding: '3px 6px', borderRadius: 6, cursor: 'pointer' }}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                    ) : (
                      <span className={`border text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${ROLE_COLOR[m.role]}`}>
                        {ROLE_ICON[m.role]} {ROLE_LABEL[m.role]}
                      </span>
                    )}

                    {/* Secrets toggle (owner only) */}
                    {isOwner && (
                      <button
                        onClick={() => handleSecretsToggle(m)}
                        title={m.canViewSecrets ? 'Revocar acceso a secretos' : 'Dar acceso a secretos'}
                        style={{ padding: '3px 7px', borderRadius: 6, border: `1px solid ${m.canViewSecrets ? '#f59e0b' : '#30363d'}`, background: m.canViewSecrets ? 'rgba(245,158,11,0.1)' : 'transparent', color: m.canViewSecrets ? '#f59e0b' : '#484f58', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <KeyRound size={11} />
                      </button>
                    )}

                    {/* Remove / leave */}
                    {(isOwner || isSelf) && (
                      <button
                        onClick={() => handleRemove(m)}
                        title={isSelf ? 'Salir del proyecto' : 'Eliminar miembro'}
                        style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #30363d', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
          Ningún colaborador todavía. Invita a alguien con el formulario de abajo.
        </p>
      )}

      {/* Invite form (owner only) */}
      {isOwner && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #21262d' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Invitar colaborador
          </div>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>@</span>
                <input
                  className="input-base"
                  style={{ paddingLeft: 24 }}
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR')}
                className="input-base"
                style={{ width: 110, flexShrink: 0 }}
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>

            {role === 'EDITOR' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary, #8b949e)', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={canViewSecrets}
                  onChange={(e) => setCanViewSecrets(e.target.checked)}
                  style={{ accentColor: '#f59e0b' }}
                />
                <KeyRound size={12} style={{ color: '#f59e0b' }} />
                Acceso a credenciales y conexiones de BD
              </label>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={inviteMut.isPending || !username.trim()}
            >
              <UserPlus size={14} />
              {inviteMut.isPending ? 'Invitando…' : 'Añadir colaborador'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
