import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Minus, Send } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { useAppStore } from '@/store/appStore';
import { useAI } from '@/hooks/useAI';
import { useProjects } from '@/hooks/useProjects';
import { AIPreviewChanges } from './AIPreviewChanges';

const QUICK_ACTIONS = [
  ['📋 List all my projects', '🔍 Find projects by stack'],
  ['✅ Update project status', '🐛 Create a bug report'],
  ['🔧 Add stack technology', '📝 Generate setup notes'],
  ['💡 What should I work on?', '📊 Project summary'],
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#39D0D8] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function statusDot(status: string) {
  if (status === 'ACTIVE') return '#22C55E';
  if (status === 'IN_DEVELOPMENT') return '#A78BFA';
  if (status === 'PAUSED') return '#F59E0B';
  return '#484F58';
}

export function AIPanel() {
  const { isPanelOpen, isProcessing, messages, selectedProjectId, selectProject, setPanel, clearMessages } = useAIStore();
  const { setHelpOpen } = useAppStore();
  const { sendMessage } = useAI();
  const { data: projects } = useProjects();
  const [draft, setDraft] = useState('');
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (isPanelOpen) setTimeout(() => textareaRef.current?.focus(), 200);
  }, [isPanelOpen]);

  async function handleSend(text?: string) {
    const msg = (text ?? draft).trim();
    if (!msg || isProcessing) return;
    setDraft('');
    await sendMessage(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleMinimize() {
    setPanel(false);
  }

  function handleClose() {
    setPanel(false);
  }

  if (!isPanelOpen) return null;

  return (
    <div
      className="fixed top-0 right-0 h-full w-[420px] z-[9998] flex flex-col bg-[#0D1117] border-l border-[#21262D] shadow-2xl"
      style={{ animation: 'slideInRight 0.25s ease' }}
    >
      <style>{`@keyframes slideInRight { from { transform: translateX(420px); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#39D0D8]" />
            <span className="font-mono text-sm font-bold text-[#39D0D8]">NEXORY AI</span>
            <span className="text-xs text-[#484F58]">Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleMinimize} className="p-1.5 hover:bg-[#21262D] rounded text-[#484F58] hover:text-[#C9D1D9] transition-colors">
              <Minus size={13} />
            </button>
            <button onClick={handleClose} className="p-1.5 hover:bg-[#21262D] rounded text-[#484F58] hover:text-[#C9D1D9] transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>
        {/* Cyan gradient line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#39D0D8] to-transparent opacity-40" />
      </div>

      {/* Project context pills */}
      {projects && projects.length > 0 && (
        <div className="shrink-0 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none border-b border-[#21262D]">
          <button
            onClick={() => selectProject(null)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] border transition-all ${selectedProjectId === null ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.12)] text-[#39D0D8]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58]'}`}
          >
            All Projects
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border transition-all ${selectedProjectId === p.id ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.12)] text-[#39D0D8]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58]'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot(p.status) }} />
              {p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Quick actions — show only when no messages */}
        {messages.length === 0 && !isProcessing && (
          <div>
            <p className="text-[11px] text-[#484F58] mb-3 text-center">Ask anything about your projects</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.flat().map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action.replace(/^[^\s]+\s/, ''))}
                  className="text-left px-3 py-2 bg-[#161B22] border border-[#21262D] rounded-md text-[11px] text-[#8B949E] hover:border-[#39D0D8] hover:text-[#C9D1D9] transition-colors leading-relaxed"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-[rgba(57,208,216,0.1)] border border-[rgba(57,208,216,0.2)] text-[#E6EDF3] rounded-xl rounded-tr-sm'
                : 'bg-[#161B22] border border-[#21262D] text-[#C9D1D9] rounded-xl rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>

              {/* Action preview */}
              {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                <AIPreviewChanges
                  actions={msg.actions}
                  msgId={msg.id}
                  applied={!!msg.actionsApplied}
                  onCancel={() => {
                    setCancelled((prev) => new Set([...prev, msg.id]));
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-[#161B22] border border-[#21262D] rounded-xl rounded-tl-sm px-3 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#21262D] p-3">
        <div className="flex items-end gap-2 bg-[#161B22] border border-[#21262D] rounded-lg px-3 py-2 focus-within:border-[#39D0D8] transition-colors">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-sm text-[#E6EDF3] placeholder:text-[#484F58] resize-none outline-none max-h-24 min-h-[20px]"
            placeholder="Ask anything about your projects..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!draft.trim() || isProcessing}
            className="p-1.5 bg-[#39D0D8] text-[#0D1117] rounded-md hover:bg-[#5DE0E7] disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-[#2A3040] mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
