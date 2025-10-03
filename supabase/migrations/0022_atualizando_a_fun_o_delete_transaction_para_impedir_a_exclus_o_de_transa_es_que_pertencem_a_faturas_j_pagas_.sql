CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_transaction RECORD;
    v_account RECORD;
    v_invoice_status TEXT; -- Para verificar o status da fatura
BEGIN
    -- Busca a transação para garantir que pertence ao usuário
    SELECT * INTO v_transaction FROM public.transactions WHERE id = p_transaction_id AND user_id = v_user_id;
    IF v_transaction IS NULL THEN
        RAISE EXCEPTION 'Transação não encontrada ou o usuário não tem permissão.';
    END IF;

    -- Verifica se a transação pertence a uma fatura paga
    IF v_transaction.invoice_id IS NOT NULL THEN
        SELECT status INTO v_invoice_status FROM public.invoices WHERE id = v_transaction.invoice_id AND user_id = v_user_id;
        IF v_invoice_status = 'paid' THEN
            RAISE EXCEPTION 'Não é possível excluir transações de faturas já pagas.';
        END IF;
    END IF;

    -- Busca a conta associada
    SELECT * INTO v_account FROM public.accounts WHERE id = v_transaction.account_id;

    -- Reverte o valor no saldo da conta (apenas para contas que não são cartão de crédito)
    IF v_account.type <> 'credit_card' THEN
        -- Se for receita (positivo), diminui o saldo.
        -- Se for despesa (negativo), aumenta o saldo (subtrair um negativo).
        UPDATE public.accounts
        SET balance = balance - v_transaction.amount
        WHERE id = v_transaction.account_id;
    END IF;

    -- Exclui a transação
    DELETE FROM public.transactions WHERE id = p_transaction_id;

    -- Se a conta era um cartão de crédito, recalcula o saldo
    IF v_account.type = 'credit_card' THEN
        PERFORM public.recalculate_credit_card_balance(v_transaction.account_id);
    END IF;
END;
$function$;