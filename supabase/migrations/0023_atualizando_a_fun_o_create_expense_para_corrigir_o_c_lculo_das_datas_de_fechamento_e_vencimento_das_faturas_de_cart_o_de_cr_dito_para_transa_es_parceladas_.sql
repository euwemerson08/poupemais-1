CREATE OR REPLACE FUNCTION public.create_expense(p_description text, p_amount numeric, p_date date, p_account_id uuid, p_category_name text, p_category_icon text, p_total_installments integer)
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
    v_installment_date DATE;
    v_is_installment BOOLEAN := p_total_installments > 1;
    v_invoice_month_start DATE; -- Variável para determinar o início do mês da fatura
BEGIN
    -- Busca os detalhes da conta
    SELECT * INTO v_account FROM public.accounts WHERE id = p_account_id AND user_id = v_user_id;
    IF v_account IS NULL THEN
        RAISE EXCEPTION 'Conta não encontrada ou o usuário não tem permissão.';
    END IF;

    -- Lógica para pagamentos com Cartão de Crédito
    IF v_account.type = 'credit_card' THEN
        IF v_account.closing_day IS NULL OR v_account.due_day IS NULL THEN
            RAISE EXCEPTION 'Cartão de crédito não tem dia de fechamento ou vencimento configurado.';
        END IF;

        v_installment_amount := p_amount / p_total_installments;

        FOR i IN 1..p_total_installments LOOP
            -- A data da parcela é a data da compra original mais os meses de intervalo
            v_installment_date := p_date + (INTERVAL '1 month' * (i - 1));

            -- Determina o mês da fatura a que esta parcela pertence
            IF EXTRACT(DAY FROM v_installment_date) > v_account.closing_day THEN
                -- Se o dia da parcela for após o dia de fechamento, a fatura é do próximo mês
                v_invoice_month_start := date_trunc('month', v_installment_date + INTERVAL '1 month');
            ELSE
                -- Caso contrário, a fatura é do mês atual da parcela
                v_invoice_month_start := date_trunc('month', v_installment_date);
            END IF;

            -- Calcula a data de fechamento da fatura
            v_closing_date := (v_invoice_month_start + (v_account.closing_day - 1) * INTERVAL '1 day')::date;

            -- Calcula a data de vencimento da fatura (sempre no mês seguinte ao fechamento)
            v_due_date := (date_trunc('month', v_closing_date + INTERVAL '1 month') + (v_account.due_day - 1) * INTERVAL '1 day')::date;

            -- Encontra ou cria a fatura para esta data de fechamento
            SELECT id INTO v_invoice_id FROM public.invoices
            WHERE account_id = p_account_id AND closing_date = v_closing_date;

            IF v_invoice_id IS NULL THEN
                INSERT INTO public.invoices (user_id, account_id, closing_date, due_date, status)
                VALUES (v_user_id, p_account_id, v_closing_date, v_due_date, 'open')
                RETURNING id INTO v_invoice_id;
            END IF;

            -- Insere a transação da parcela
            INSERT INTO public.transactions (user_id, account_id, description, amount, date, is_paid, is_installment, installment_number, total_installments, invoice_id, category_name, category_icon)
            VALUES (v_user_id, p_account_id, p_description, -v_installment_amount, p_date, false, v_is_installment, i, p_total_installments, v_invoice_id, p_category_name, p_category_icon);
        END LOOP;

        -- Recalcula o saldo do cartão de crédito após a inserção das transações
        PERFORM public.recalculate_credit_card_balance(p_account_id);

    -- Lógica para pagamentos com Débito, Carteira, Pix
    ELSE
        UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_account_id;

        INSERT INTO public.transactions (user_id, account_id, description, amount, date, is_paid, is_installment, category_name, category_icon)
        VALUES (v_user_id, p_account_id, p_description, -p_amount, p_date, true, false, p_category_name, p_category_icon);
    END IF;
END;
$function$;