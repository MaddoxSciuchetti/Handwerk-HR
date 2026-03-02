import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import './index.css';
import { router } from './router';

import { RouterProvider } from '@tanstack/react-router';
import queryClient from './config/query.client';
import { ProcessDataProvider } from './features/employee-overview/contexts/ProcessDataProvider';
import './styles/theme.css';

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ProcessDataProvider>
      <RouterProvider router={router} />
    </ProcessDataProvider>
  </QueryClientProvider>
);
