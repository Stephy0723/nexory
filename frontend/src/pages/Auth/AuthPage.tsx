import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', username: '', password: '' });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.username, form.password);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080B12] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#39D0D8] flex items-center justify-center">
            <Zap size={18} className="text-[#080B12]" />
          </div>
          <span className="text-xl font-bold text-[#E6EDF3] tracking-wide">NEXORY</span>
        </div>

        <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-6">
          {/* Tabs */}
          <div className="flex bg-[#080B12] rounded-lg p-1 mb-6 gap-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  mode === m ? 'bg-[#161B22] text-[#E6EDF3]' : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Email</label>
              <input
                className="input-base"
                type="email"
                placeholder="demo@nexory.dev"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Username</label>
                <input
                  className="input-base"
                  type="text"
                  placeholder="nexory_demo"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  className="input-base pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-1" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-xs text-[#484F58] text-center mt-4">
              Demo: <span className="text-[#8B949E]">demo@nexory.dev</span> / <span className="text-[#8B949E]">nexory123</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}