import {demoUser} from './utils/showcaseAdapter';
import {useAuthStore} from './store/authStore';
import './steliantDemo.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

useAuthStore.getState().setAuth(demoUser, 'showcase-local-only');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#161B22',
              color: '#E6EDF3',
              border: '1px solid #21262D',
              borderRadius: '8px',
              fontSize: '0.875rem',
            },
          }}
        />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

