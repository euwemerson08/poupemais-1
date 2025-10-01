-- Corrige a função de criar despesas para atualizar o saldo da fatura do cartão
CREATE OR REPLACE FUNCTION public.create_expense(
    p_description text,
    p_amount numeric,
    p_date date,
    p_account_id uuid,
    p_category_name text,
    p_category_icon text,
    p_total_installments integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_account RECORD;
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_installment_amount NUMERIC;
    v_purchase_day INT;
    v_installment_date DATE;
    v_is_installment BOOLEAN := p_total_installments > 1;
BEGIN
    -- Busca os detalhes da conta
    SELECT * INTO v_account FROM public.accounts WHERE id = p_account_id AND user_id = v_user_id;
    IF v_account IS NULL THEN
        RAISE EXCEPTION 'Conta não encontrada ou o usuário não tem permissão.';
    END IF;

    -- Lógica para pagamentos com Cartão de Crédito
    IF v_account.type = 'credit_card' THEN
        -- Adiciona o valor total à "Fatura Atual" (campo balance)
        UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_account_id;

        v_installment_amount := p_amount / p_total_installments;

        FOR i IN 1..p_total_installments LOOP
            v_installment_date := p_date + (INTERVAL '1 month' * (i - 1));
            v_purchase_day := EXTRACT(DAY FROM v_installment_date);

            IF v_account.closing_day IS NULL OR v_account.due_day IS NULL THEN
                RAISE EXCEPTION 'Cartão de crédito não tem dia de fechamento ou vencimento configurado.';
            END IF;

            IF v_purchase_day > v_account.closing_day THEN
                v_closing_date := (date_trunc('month', v_installment_date) + interval '1 month' + (v_account.closing_day - 1) * interval '1 day')::date;
            ELSE
                v_closing_date := (date_trunc('month', v_installment_date) + (v_account.closing_day - 1) * interval '1 day')::date;
            END IF;

            IF v_account.due_day > v_account.closing_day THEN
                v_due_date := (date_trunc('month', v_closing_date) + (v_account.due_day - 1) * interval '1 day')::date;
            ELSE
                v_due_date := (date_trunc('month', v_closing_date) + interval '1 month' + (v_account.due_day - 1) * interval '1 day')::date;
            END IF;

            SELECT id INTO v_invoice_id FROM public.invoices
            WHERE account_id = p_account_id AND closing_date = v_closing_date;

            IF v_invoice_id IS NULL THEN
                INSERT INTO public.invoices (user_id, account_id, closing_date, due_date, status)
                VALUES (v_user_id, p_account_id, v_closing_date, v_due_date, 'open')
                RETURNING id INTO v_invoice_id;
            END IF;

            INSERT INTO public.transactions (user_id, account_id, description, amount, date, is_paid, is_installment, installment_number, total_installments, invoice_id, category_name, category_icon)
            VALUES (v_user_id, p_account_id, p_description, -v_installment_amount, p_date, false, v_is_installment, i, p_total_installments, v_invoice_id, p_category_name, p_category_icon);
        END LOOP;

    -- Lógica para pagamentos com Débito, Carteira, Pix
    ELSE
        UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_account_id;

        INSERT INTO public.transactions (user_id, account_id, description, amount, date, is_paid, is_installment, category_name, category_icon)
        VALUES (v_user_id, p_account_id, p_description, -p_amount, p_date, true, false, p_category_name, p_category_icon);
    END IF;
END;
$function$
;

-- Corrige a função de editar transações para reverter e aplicar saldos corretamente
CREATE OR REPLACE FUNCTION public.update_transaction(
    p_transaction_id uuid,
    p_description text,
    p_amount numeric, -- Espera-se que seja negativo para despesas
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
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_purchase_day INT;
BEGIN
    SELECT * INTO v_old_transaction FROM public.transactions WHERE id = p_transaction_id AND user_id = v_user_id;
    IF v_old_transaction IS NULL THEN RAISE EXCEPTION 'Transação não encontrada ou permissão negada.'; END IF;
    IF v_old_transaction.is_installment THEN RAISE EXCEPTION 'Não é possível editar uma transação parcelada individualmente.'; END IF;

    SELECT * INTO v_old_account FROM public.accounts WHERE id = v_old_transaction.account_id;
    SELECT * INTO v_new_account FROM public.accounts WHERE id = p_account_id;

    -- Passo 1: Reverte o impacto financeiro da transação antiga
    IF v_old_account.type = 'credit_card' THEN
        UPDATE public.accounts SET balance = balance + v_old_transaction.amount WHERE id = v_old_transaction.account_id;
    ELSE
        UPDATE public.accounts SET balance = balance - v_old_transaction.amount WHERE id = v_old_transaction.account_id;
    END IF;

    -- Passo 2: Aplica o impacto financeiro com os novos detalhes da transação
    IF v_new_account.type = 'credit_card' THEN
        UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_account_id;

        v_purchase_day := EXTRACT(DAY FROM p_date);
        IF v_new_account.closing_day IS NULL OR v_new_account.due_day IS NULL THEN
            RAISE EXCEPTION 'Cartão de crédito não tem dia de fechamento ou vencimento configurado.';
        END IF;

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
        SET description = p_description, amount = p_amount, date = p_date, account_id = p_account_id, category_name = p_category_name, category_icon = p_category_icon, invoice_id = v_invoice_id, is_paid = false
        WHERE id = p_transaction_id;
    ELSE
        UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_account_id;
        
        UPDATE public.transactions
        SET description = p_description, amount = p_amount, date = p_date, account_id = p_account_id, category_name = p_category_name, category_icon = p_category_icon, invoice_id = NULL, is_paid = true
        WHERE id = p_transaction_id;
    END IF;
END;
$function$
;