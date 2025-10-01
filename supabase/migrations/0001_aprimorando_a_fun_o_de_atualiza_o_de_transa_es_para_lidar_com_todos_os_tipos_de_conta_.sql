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
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_old_transaction RECORD;
    v_old_account RECORD;
    v_new_account RECORD;
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_purchase_day INT;
BEGIN
    -- Busca os detalhes da transação antiga
    SELECT * INTO v_old_transaction FROM public.transactions WHERE id = p_transaction_id AND user_id = v_user_id;
    IF v_old_transaction IS NULL THEN RAISE EXCEPTION 'Transação não encontrada ou permissão negada.'; END IF;
    IF v_old_transaction.is_installment THEN RAISE EXCEPTION 'Não é possível editar uma transação parcelada individualmente.'; END IF;

    -- Busca os detalhes das contas
    SELECT * INTO v_old_account FROM public.accounts WHERE id = v_old_transaction.account_id;
    SELECT * INTO v_new_account FROM public.accounts WHERE id = p_account_id;

    -- Passo 1: Reverte o impacto financeiro da transação antiga
    IF v_old_account.type <> 'credit_card' THEN
        UPDATE public.accounts SET balance = balance - v_old_transaction.amount WHERE id = v_old_transaction.account_id;
    END IF;

    -- Passo 2: Aplica o impacto financeiro com os novos detalhes da transação
    IF v_new_account.type <> 'credit_card' THEN
        -- A transação é ou passou a ser de débito/carteira
        UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_account_id;
        
        UPDATE public.transactions
        SET 
            description = p_description,
            amount = p_amount,
            date = p_date,
            account_id = p_account_id,
            category_name = p_category_name,
            category_icon = p_category_icon,
            invoice_id = NULL,
            is_paid = true
        WHERE id = p_transaction_id;
    ELSE
        -- A transação é ou passou a ser de cartão de crédito, então encontra ou cria a fatura correta
        v_purchase_day := EXTRACT(DAY FROM p_date);

        IF v_purchase_day > v_new_account.closing_day THEN
            v_closing_date := (date_trunc('month', p_date) + interval '1 month' + (v_new_account.closing_day - 1) * interval '1 day')::date;
        ELSE
            v_closing_date := (date_trunc('month', p_date) + (v_new_account.closing_day - 1) * interval '1 day')::date;
        END IF;

        IF v_new_account.due_day > v_new_account.closing_day THEN
            v_due_date := (date_trunc('month', v_closing_date) + (v_new_account.due_day - 1) * interval '1 day')::date;
        ELSE
            v_due_date := (date_trunc('month', v_closing_date) + interval '1 month' + (v_new_account.due_day - 1) * interval '1 day')::date;
        END IF;

        SELECT id INTO v_invoice_id FROM public.invoices WHERE account_id = p_account_id AND closing_date = v_closing_date;

        IF v_invoice_id IS NULL THEN
            INSERT INTO public.invoices (user_id, account_id, closing_date, due_date, status)
            VALUES (v_user_id, p_account_id, v_closing_date, v_due_date, 'open')
            RETURNING id INTO v_invoice_id;
        END IF;

        UPDATE public.transactions
        SET 
            description = p_description,
            amount = p_amount,
            date = p_date,
            account_id = p_account_id,
            category_name = p_category_name,
            category_icon = p_category_icon,
            invoice_id = v_invoice_id,
            is_paid = false
        WHERE id = p_transaction_id;
    END IF;
END;
$$;