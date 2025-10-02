CREATE OR REPLACE FUNCTION public.recalculate_credit_card_balance(p_account_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_current_invoice_id UUID;
    v_current_invoice_balance NUMERIC := 0;
BEGIN
    -- Encontra a fatura aberta mais recente para a conta
    SELECT id INTO v_current_invoice_id
    FROM public.invoices
    WHERE account_id = p_account_id
      AND user_id = v_user_id
      AND status = 'open'
    ORDER BY closing_date DESC
    LIMIT 1;

    IF v_current_invoice_id IS NOT NULL THEN
        -- Soma os valores de todas as transações não pagas para esta fatura
        SELECT COALESCE(SUM(amount), 0) INTO v_current_invoice_balance
        FROM public.transactions
        WHERE invoice_id = v_current_invoice_id
          AND user_id = v_user_id
          AND is_paid = false; -- Apenas transações não pagas contribuem para o saldo atual
    END IF;

    -- Atualiza o saldo da conta com o saldo da fatura atual calculado
    UPDATE public.accounts
    SET balance = v_current_invoice_balance
    WHERE id = p_account_id AND user_id = v_user_id;
END;
$function$;