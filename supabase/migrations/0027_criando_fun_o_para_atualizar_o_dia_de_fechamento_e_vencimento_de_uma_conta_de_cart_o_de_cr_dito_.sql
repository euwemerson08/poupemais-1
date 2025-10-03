CREATE OR REPLACE FUNCTION public.update_account_closing_days(
    p_account_id UUID,
    p_closing_day INT,
    p_due_day INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    UPDATE public.accounts
    SET
        closing_day = p_closing_day,
        due_day = p_due_day
    WHERE
        id = p_account_id AND user_id = v_user_id AND type = 'credit_card';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conta de cartão de crédito não encontrada ou o usuário não tem permissão.';
    END IF;
END;
$function$;