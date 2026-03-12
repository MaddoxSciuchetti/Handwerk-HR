import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import './App.css';
import './index.css';
import { router } from './router';

import { RouterProvider } from '@tanstack/react-router';
import queryClient from './config/query.client';
import { ThemeProvider } from './context/theme-provider/ThemeProvider';
import './styles/theme.css';

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </QueryClientProvider>
);
