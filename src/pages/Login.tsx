import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
// Removido o import de PiggyBank, pois será substituído pela imagem da logo

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <img src="/LOGO.png" alt="Financely Logo" className="h-8" />
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(150 100% 30%)', // Um verde vibrante
                  brandAccent: 'hsl(150 100% 25%)', // Um verde um pouco mais escuro para hover/active
                },
              },
            },
          }}
          providers={[]}
          theme="dark"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Endereço de e-mail',
                password_label: 'Sua Senha',
                email_input_placeholder: 'Seu endereço de e-mail',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                link_text: 'Não tem uma conta? Cadastre-se',
              },
              forgotten_password: { // Adicionando traduções para a tela de recuperação de senha
                email_label: 'Endereço de e-mail',
                email_input_placeholder: 'Seu endereço de e-mail',
                button_label: 'Enviar instruções de redefinição de senha',
                link_text: 'Lembrou da sua senha? Entrar',
              },
            },
          }}
        />
        <footer className="p-4 text-center text-sm text-gray-500 border-t border-border mt-auto">
          Por Apice Tecnologia
        </footer>
      </div>
    </div>
  );
};

export default Login;