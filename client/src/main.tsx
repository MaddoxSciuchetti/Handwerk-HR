import './instrument';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './App.css';
import '../globals.css';
import './index.css';

import queryClient from './config/query.client';
import { ThemeProvider } from './context/theme-provider/ThemeProvider';
import { AppRouter } from './router';
import { reportWebVitals } from './reportWebVitals';
import './styles/theme.css';

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </QueryClientProvider>
);

reportWebVitals();
