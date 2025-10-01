CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_transaction RECORD;
    v_account RECORD;
BEGIN
    -- Busca a transação para garantir que pertence ao usuário
    SELECT * INTO v_transaction FROM public.transactions WHERE id = p_transaction_id AND user_id = v_user_id;
    IF v_transaction IS NULL THEN
        RAISE EXCEPTION 'Transação não encontrada ou o usuário não tem permissão.';
    END IF;

    -- Busca a conta associada
    SELECT * INTO v_account FROM public.accounts WHERE id = v_transaction.account_id;

    -- Se não for uma transação de cartão de crédito, reverte o valor no saldo da conta
    IF v_account.type <> 'credit_card' THEN
        UPDATE public.accounts
        SET balance = balance - v_transaction.amount
        WHERE id = v_transaction.account_id;
    END IF;

    -- Exclui a transação
    DELETE FROM public.transactions WHERE id = p_transaction_id;
END;
$function$