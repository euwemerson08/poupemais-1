import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <Plus className="h-8 w-8 text-primary" strokeWidth={3} />
          <h1 className="text-3xl font-bold text-center">Poupe</h1> {/* Nome do aplicativo alterado para Poupe */}
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Seu e-mail',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Crie sua senha',
                button_label: 'Cadastrar',
                social_provider_text: 'Cadastrar com {{provider}}',
                link_text: 'Não tem uma conta? Cadastrar',
              },
              forgotten_password: {
                email_label: 'Seu e-mail',
                email_input_placeholder: 'Digite seu e-mail para redefinir a senha',
                button_label: 'Enviar instruções de redefinição',
                link_text: 'Esqueceu sua senha?',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Digite sua nova senha',
                button_label: 'Atualizar senha',
              },
              magic_link: {
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar link mágico',
                link_text: 'Enviar um link mágico',
              },
              verify_otp: {
                email_input_placeholder: 'Digite seu e-mail',
                phone_input_placeholder: 'Digite seu telefone',
                token_input_placeholder: 'Código OTP',
                button_label: 'Verificar OTP',
                link_text: 'Já tem um código OTP? Entrar',
              },
            },
          }}
        />
      </div>
    </div>
  );
}