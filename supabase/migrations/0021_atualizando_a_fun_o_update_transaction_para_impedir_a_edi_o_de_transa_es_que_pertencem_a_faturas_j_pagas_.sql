CREATE OR REPLACE FUNCTION public.update_transaction(p_transaction_id uuid, p_description text, p_amount numeric, p_date date, p_account_id uuid, p_category_name text, p_category_icon text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_old_transaction RECORD;
    v_old_account RECORD;
    v_new_account RECORD;
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_invoice_status TEXT; -- Para verificar o status da fatura
    v_purchase_day INT;
    v_invoice_month_start DATE; -- Variável para determinar o início do mês da fatura
BEGIN
    SELECT * INTO v_old_transaction FROM public.transactions WHERE id = p_transaction_id AND user_id = v_user_id;
    IF v_old_transaction IS NULL THEN RAISE EXCEPTION 'Transação não encontrada ou permissão negada.'; END IF;
    IF v_old_transaction.is_installment THEN RAISE EXCEPTION 'Não é possível editar uma transação parcelada individualmente.'; END IF;

    -- Verifica se a transação pertence a uma fatura paga
    IF v_old_transaction.invoice_id IS NOT NULL THEN
        SELECT status INTO v_invoice_status FROM public.invoices WHERE id = v_old_transaction.invoice_id AND user_id = v_user_id;
        IF v_invoice_status = 'paid' THEN
            RAISE EXCEPTION 'Não é possível editar transações de faturas já pagas.';
        END IF;
    END IF;

    SELECT * INTO v_old_account FROM public.accounts WHERE id = v_old_transaction.account_id;
    SELECT * INTO v_new_account FROM public.accounts WHERE id = p_account_id;

    -- Passo 1: Reverte o impacto financeiro da transação antiga (apenas para contas que não são cartão de crédito)
    IF v_old_account.type <> 'credit_card' THEN
        UPDATE public.accounts SET balance = balance - v_old_transaction.amount WHERE id = v_old_transaction.account_id;
    END IF;

    -- Passo 2: Aplica o impacto financeiro com os novos detalhes da transação (apenas para contas que não são cartão de crédito)
    IF v_new_account.type <> 'credit_card' THEN
        UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_account_id;
    END IF;

    -- Lógica para determinar invoice_id se a nova conta for cartão de crédito
    IF v_new_account.type = 'credit_card' THEN
        IF v_new_account.closing_day IS NULL OR v_new_account.due_day IS NULL THEN
            RAISE EXCEPTION 'Cartão de crédito não tem dia de fechamento ou vencimento configurado.';
        END IF;

        -- Determina o mês da fatura a que esta transação pertence
        IF EXTRACT(DAY FROM p_date) > v_new_account.closing_day THEN
            -- Se o dia da transação for após o dia de fechamento, a fatura é do próximo mês
            v_invoice_month_start := date_trunc('month', p_date + INTERVAL '1 month');
        ELSE
            -- Caso contrário, a fatura é do mês atual da transação
            v_invoice_month_start := date_trunc('month', p_date);
        END IF;

        -- Calcula a data de fechamento da fatura
        v_closing_date := (v_invoice_month_start + (v_new_account.closing_day - 1) * INTERVAL '1 day')::date;

        -- Calcula a data de vencimento da fatura (sempre no mês seguinte ao fechamento)
        v_due_date := (date_trunc('month', v_closing_date + INTERVAL '1 month') + (v_new_account.due_day - 1) * INTERVAL '1 day')::date;

        SELECT id INTO v_invoice_id FROM public.invoices WHERE account_id = p_account_id AND closing_date = v_closing_date;

        IF v_invoice_id IS NULL THEN
            INSERT INTO public.invoices (user_id, account_id, closing_date, due_date, status)
            VALUES (v_user_id, p_account_id, v_closing_date, v_due_date, 'open')
            RETURNING id INTO v_invoice_id;
        END IF;
    END IF;

    -- Atualiza a transação
    UPDATE public.transactions
    SET
        description = p_description,
        amount = CASE WHEN v_new_account.type = 'credit_card' THEN -p_amount ELSE p_amount END, -- Garante que o valor é negativo para despesas de cartão de crédito
        date = p_date,
        account_id = p_account_id,
        category_name = p_category_name,
        category_icon = p_category_icon,
        invoice_id = CASE WHEN v_new_account.type = 'credit_card' THEN v_invoice_id ELSE NULL END,
        is_paid = CASE WHEN v_new_account.type = 'credit_card' THEN false ELSE true END -- Transações de cartão de crédito são inicialmente não pagas
    WHERE id = p_transaction_id;

    -- Recalcula o saldo para contas de cartão de crédito envolvidas
    IF v_old_account.type = 'credit_card' THEN
        PERFORM public.recalculate_credit_card_balance(v_old_transaction.account_id);
    END IF;
    IF v_new_account.type = 'credit_card' THEN
        PERFORM public.recalculate_credit_card_balance(p_account_id);
    END IF;
END;
$function$;