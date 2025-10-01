CREATE OR REPLACE FUNCTION public.update_transaction(
    p_transaction_id UUID,
    p_description TEXT,
    p_amount NUMERIC,
    p_date DATE,
    p_account_id UUID,
    p_category_name TEXT,
    p_category_icon TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_old_transaction RECORD;
    v_old_account RECORD;
    v_new_account RECORD;
BEGIN
    -- Busca os detalhes da transação antiga
    SELECT * INTO v_old_transaction FROM public.transactions 
    WHERE id = p_transaction_id AND user_id = v_user_id;

    IF v_old_transaction IS NULL THEN
        RAISE EXCEPTION 'Transação não encontrada ou permissão negada.';
    END IF;

    -- Busca os detalhes da conta antiga e da nova conta
    SELECT * INTO v_old_account FROM public.accounts WHERE id = v_old_transaction.account_id;
    SELECT * INTO v_new_account FROM public.accounts WHERE id = p_account_id;

    -- Reverte o valor da transação antiga no saldo da conta antiga (se não for cartão de crédito)
    IF v_old_account.type <> 'credit_card' THEN
        UPDATE public.accounts
        SET balance = balance - v_old_transaction.amount
        WHERE id = v_old_transaction.account_id;
    END IF;

    -- Aplica o novo valor da transação no saldo da nova conta (se não for cartão de crédito)
    IF v_new_account.type <> 'credit_card' THEN
        UPDATE public.accounts
        SET balance = balance + p_amount
        WHERE id = p_account_id;
    END IF;

    -- Atualiza a transação com os novos dados
    UPDATE public.transactions
    SET
        description = p_description,
        amount = p_amount,
        date = p_date,
        account_id = p_account_id,
        category_name = p_category_name,
        category_icon = p_category_icon
    WHERE id = p_transaction_id;

END;
$$;