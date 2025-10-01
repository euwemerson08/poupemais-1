-- Remover políticas de RLS para 'recurring_receivables'
DROP POLICY IF EXISTS "Users can view their own recurring receivables" ON public.recurring_receivables;
DROP POLICY IF EXISTS "Users can insert their own recurring receivables" ON public.recurring_receivables;
DROP POLICY IF EXISTS "Users can update their own recurring receivables" ON public.recurring_receivables;
DROP POLICY IF EXISTS "Users can delete their own recurring receivables" ON public.recurring_receivables;

-- Desabilitar RLS antes de dropar a tabela (se necessário, embora DROP TABLE CASCADE geralmente lide com isso)
ALTER TABLE public.recurring_receivables DISABLE ROW LEVEL SECURITY;

-- Remover a tabela 'recurring_receivables'
DROP TABLE IF EXISTS public.recurring_receivables;