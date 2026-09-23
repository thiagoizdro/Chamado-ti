import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import './index.css';
import { queryClient } from './lib/queryClient.ts';

const elementoRaiz = document.getElementById('root');

if (!elementoRaiz) {
  throw new Error('Elemento #root não encontrado no index.html');
}

createRoot(elementoRaiz).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
