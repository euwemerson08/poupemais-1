import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import Settings from "./pages/Settings";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import { SessionProvider } from "./components/SessionProvider";

function App() {
  return (
    <SessionProvider>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </SessionProvider>
  );
}

export default App;