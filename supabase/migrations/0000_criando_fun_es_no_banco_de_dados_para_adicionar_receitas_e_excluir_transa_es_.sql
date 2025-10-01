-- Função para criar uma nova receita
CREATE OR REPLACE FUNCTION public.create_income(
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
BEGIN
    -- Adiciona o valor ao saldo da conta (não pode ser cartão de crédito)
    UPDATE public.accounts 
    SET balance = balance + p_amount 
    WHERE id = p_account_id AND user_id = v_user_id AND type <> 'credit_card';

    -- Insere a transação de receita
    INSERT INTO public.transactions (user_id, account_id, description, amount, date, is_paid, is_installment, category_name, category_icon)
    VALUES (v_user_id, p_account_id, p_description, p_amount, p_date, true, false, p_category_name, p_category_icon);
END;
$$;

-- Função para excluir uma transação existente
CREATE OR REPLACE FUNCTION public.delete_transaction(
    p_transaction_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;