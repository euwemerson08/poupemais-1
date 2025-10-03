import { Outlet, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { VisibilityProvider } from "@/contexts/VisibilityContext"; // Importar VisibilityProvider

export const RootLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          <VisibilityProvider> {/* Envolver o Outlet com o VisibilityProvider */}
            <Outlet />
          </VisibilityProvider>
        </main>
        <footer className="p-4 text-center text-sm text-gray-500 border-t border-border mt-auto">
          Por Apice Tecnologia
        </footer>
      </div>
    </div>
  );
};