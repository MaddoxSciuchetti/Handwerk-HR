import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import "./index.css";

import "./styles/theme.css";
import { RouterProvider } from "@tanstack/react-router";
import queryClient from "./config/query.client";

import { Provider } from "@/components/ui/provider";
import { ProcessDataProvider } from "./contexts/ProcessDataContext";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ProcessDataProvider>
      <RouterProvider router={router} />
    </ProcessDataProvider>
  </QueryClientProvider>,
);
