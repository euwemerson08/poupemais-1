-- Adicionar colunas de categoria à tabela 'receivables'
ALTER TABLE public.receivables
ADD COLUMN category_name TEXT,
ADD COLUMN category_icon TEXT;

-- Criar a tabela 'recurring_receivables'
CREATE TABLE public.recurring_receivables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category_name TEXT NOT NULL,
  category_icon TEXT NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (SEGURANÇA OBRIGATÓRIA)
ALTER TABLE public.recurring_receivables ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para 'recurring_receivables'
CREATE POLICY "Users can view their own recurring receivables" ON public.recurring_receivables
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring receivables" ON public.recurring_receivables
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring receivables" ON public.recurring_receivables
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring receivables" ON public.recurring_receivables
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Criar a função para deletar um recebimento
CREATE OR REPLACE FUNCTION public.delete_receivable(p_receivable_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_receivable RECORD;
BEGIN
    -- Busca o recebimento para garantir que pertence ao usuário
    SELECT * INTO v_receivable FROM public.receivables WHERE id = p_receivable_id AND user_id = v_user_id;
    IF v_receivable IS NULL THEN
        RAISE EXCEPTION 'Recebimento não encontrado ou o usuário não tem permissão.';
    END IF;

    -- Exclui o recebimento
    DELETE FROM public.receivables WHERE id = p_receivable_id;
END;
$function$;