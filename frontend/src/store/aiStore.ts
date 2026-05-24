import { create } from 'zustand';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
  actionsApplied?: boolean;
}

export interface AIAction {
  type: 'UPDATE_PROJECT' | 'CREATE_TASK' | 'CREATE_CREDENTIAL' | 'ADD_STACK' | 'UPDATE_TASK' | 'CREATE_NOTE' | 'CREATE_DB' | 'BULK_UPDATE';
  projectId?: string;
  projectName?: string;
  data?: Record<string, unknown>;
  description?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface AIState {
  isPanelOpen: boolean;
  isProcessing: boolean;
  selectedProjectId: string | null;
  messages: AIMessage[];
  conversationHistory: ConversationTurn[];
  setPanel: (open: boolean) => void;
  togglePanel: () => void;
  setProcessing: (v: boolean) => void;
  selectProject: (id: string | null) => void;
  addMessage: (msg: AIMessage) => void;
  markActionsApplied: (msgId: string) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  isPanelOpen: false,
  isProcessing: false,
  selectedProjectId: null,
  messages: [],
  conversationHistory: [],
  setPanel: (isPanelOpen) => set({ isPanelOpen }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  setProcessing: (isProcessing) => set({ isProcessing }),
  selectProject: (selectedProjectId) => set({ selectedProjectId }),
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, msg],
      conversationHistory: [
        ...s.conversationHistory,
        { role: msg.role, content: msg.content },
      ],
    })),
  markActionsApplied: (msgId) =>
    set((s) => ({
      messages: s.messages.map((m) => m.id === msgId ? { ...m, actionsApplied: true } : m),
    })),
  clearMessages: () => set({ messages: [], conversationHistory: [] }),
}));
