import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import Settings from "./pages/Settings"; // Importar a página de configurações geral
import { SessionContextProvider } from "@supabase/auth-ui-react";
import { supabase } from "./integrations/supabase/client";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          {/* Rotas About e Contact removidas pois os arquivos não existem */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} /> {/* Rota para a página de configurações geral */}
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </SessionContextProvider>
  );
}

export default App;