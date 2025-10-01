import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Accounts from "./pages/Accounts";
import CreditCards from "./pages/CreditCards";
import Invoices from "./pages/Invoices";
import Transactions from "./pages/Transactions";
import FixedExpenses from "./pages/FixedExpenses";
import FinancialPlan from "./pages/FinancialPlan";
import Receivables from "./pages/Receivables";
import RecurringReceivables from "./pages/RecurringReceivables"; // Importar a nova página
import Login from "./pages/Login";
import { RootLayout } from "./components/RootLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RootLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/credit-cards" element={<CreditCards />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/fixed-expenses" element={<FixedExpenses />} />
            <Route path="/financial-plan" element={<FinancialPlan />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/recurring-receivables" element={<RecurringReceivables />} /> {/* Nova rota */}
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;