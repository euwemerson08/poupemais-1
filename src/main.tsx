import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Importar QueryClient e QueryClientProvider

const queryClient = new QueryClient(); // Criar uma nova instância do QueryClient

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}> {/* Envolver o App com QueryClientProvider */}
    <App />
  </QueryClientProvider>
);