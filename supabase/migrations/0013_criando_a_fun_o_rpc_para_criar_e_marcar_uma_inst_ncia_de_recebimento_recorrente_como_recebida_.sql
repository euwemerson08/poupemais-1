CREATE OR REPLACE FUNCTION public.create_and_mark_recurring_receivable_instance_as_received(
    p_recurring_receivable_id uuid,
    p_account_id uuid,
    p_received_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_recurring_receivable RECORD;
BEGIN
    -- Busca o template de recebimento recorrente
    SELECT * INTO v_recurring_receivable
    FROM public.recurring_receivables
    WHERE id = p_recurring_receivable_id AND user_id = v_user_id;

    IF v_recurring_receivable IS NULL THEN
        RAISE EXCEPTION 'Template de recebimento recorrente não encontrado ou o usuário não tem permissão.';
    END IF;

    -- Insere um novo recebimento único baseado no template, marcando-o como recebido
    INSERT INTO public.receivables (
        user_id,
        description,
        amount,
        due_date, -- Usar a data de recebimento como due_date para a instância
        status,
        received_at,
        category_name,
        category_icon
    )
    VALUES (
        v_user_id,
        v_recurring_receivable.description,
        v_recurring_receivable.amount,
        p_received_date, -- Data em que foi recebido
        'received',
        NOW(),
        v_recurring_receivable.category_name,
        v_recurring_receivable.category_icon
    );

    -- Adiciona o valor ao saldo da conta selecionada
    UPDATE public.accounts
    SET balance = balance + v_recurring_receivable.amount
    WHERE id = p_account_id AND user_id = v_user_id;
END;
$function$;