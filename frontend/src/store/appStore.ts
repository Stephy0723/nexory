import { create } from 'zustand';

type Module = 'dashboard' | 'projects' | 'credentials' | 'tasks' | 'notes' | 'database' | 'activity';

interface AppState {
  activeModule: Module;
  searchQuery: string;
  isHelpOpen: boolean;
  setModule: (module: Module) => void;
  setSearch: (q: string) => void;
  setHelpOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  searchQuery: '',
  isHelpOpen: false,
  setModule: (activeModule) => set({ activeModule }),
  setSearch: (searchQuery) => set({ searchQuery }),
  setHelpOpen: (isHelpOpen) => set({ isHelpOpen }),
}));
