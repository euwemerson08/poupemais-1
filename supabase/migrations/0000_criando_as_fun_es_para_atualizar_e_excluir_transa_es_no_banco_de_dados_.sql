-- Função para excluir uma transação e reverter o saldo (se aplicável)
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
;

-- Função para atualizar uma transação
CREATE OR REPLACE FUNCTION public.update_transaction(
    p_transaction_id uuid,
    p_description text,
    p_amount numeric,
    p_date date,
    p_account_id uuid,
    p_category_name text,
    p_category_icon text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;