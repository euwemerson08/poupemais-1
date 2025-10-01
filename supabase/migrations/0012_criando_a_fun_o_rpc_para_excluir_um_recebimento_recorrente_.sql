CREATE OR REPLACE FUNCTION public.delete_recurring_receivable(p_recurring_receivable_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_recurring_receivable RECORD;
BEGIN
    -- Busca o recebimento recorrente para garantir que pertence ao usuário
    SELECT * INTO v_recurring_receivable FROM public.recurring_receivables WHERE id = p_recurring_receivable_id AND user_id = v_user_id;
    IF v_recurring_receivable IS NULL THEN
        RAISE EXCEPTION 'Recebimento recorrente não encontrado ou o usuário não tem permissão.';
    END IF;

    -- Exclui o recebimento recorrente
    DELETE FROM public.recurring_receivables WHERE id = p_recurring_receivable_id;
END;
$function$;