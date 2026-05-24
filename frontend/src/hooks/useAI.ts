import { useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useAIStore, type AIAction } from '@/store/aiStore';
import { useAppStore } from '@/store/appStore';
import { nanoid } from 'nanoid';

function getNanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useAI() {
  const qc = useQueryClient();
  const store = useAIStore();
  const { activeModule } = useAppStore();

  async function sendMessage(text: string) {
    if (!text.trim() || store.isProcessing) return;

    const userMsg = { id: getNanoid(), role: 'user' as const, content: text };
    store.addMessage(userMsg);
    store.setProcessing(true);

    // Gather project context from cache
    const projectsData = qc.getQueryData<any[]>(['projects', undefined]) ?? [];

    try {
      const { data } = await api.post('/ai/chat', {
        message: text,
        projectId: store.selectedProjectId,
        conversationHistory: store.conversationHistory.slice(-20), // last 20 turns
        context: { currentPage: activeModule, projects: projectsData },
      });

      const result = data.data;
      const aiMsg = {
        id: getNanoid(),
        role: 'assistant' as const,
        content: result.message || '',
        actions: result.actions?.length ? result.actions : undefined,
      };
      store.addMessage(aiMsg);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || 'Something went wrong.';
      store.addMessage({
        id: getNanoid(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errMsg}`,
      });
    } finally {
      store.setProcessing(false);
    }
  }

  async function applyChanges(actions: AIAction[], msgId: string) {
    try {
      await api.post('/ai/apply', { actions });
      // Invalidate all relevant query keys
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['projects'] }),
        qc.invalidateQueries({ queryKey: ['tasks'] }),
        qc.invalidateQueries({ queryKey: ['notes'] }),
        qc.invalidateQueries({ queryKey: ['credentials'] }),
        qc.invalidateQueries({ queryKey: ['activity'] }),
      ]);
      store.markActionsApplied(msgId);
      return true;
    } catch {
      return false;
    }
  }

  return { sendMessage, applyChanges };
}
