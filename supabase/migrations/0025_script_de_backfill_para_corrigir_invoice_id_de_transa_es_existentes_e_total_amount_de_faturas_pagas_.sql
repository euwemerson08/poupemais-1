DO $$
DECLARE
    r_transaction RECORD;
    v_account RECORD;
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_current_month_closing_day INT;
    v_user_id UUID;
BEGIN
    -- Update invoice_id for existing credit card transactions
    FOR r_transaction IN
        SELECT t.id, t.date, t.amount, t.account_id, a.closing_day, a.due_day, a.user_id
        FROM public.transactions t
        JOIN public.accounts a ON t.account_id = a.id
        WHERE a.type = 'credit_card' AND t.invoice_id IS NULL -- Only update transactions without an invoice_id
    LOOP
        v_user_id := r_transaction.user_id;

        -- Determine the effective closing day for the transaction month
        v_current_month_closing_day := LEAST(r_transaction.closing_day, EXTRACT(DAY FROM (date_trunc('month', r_transaction.date) + INTERVAL '1 month' - INTERVAL '1 day'))::int);

        -- Determine the invoice closing date for this transaction
        IF EXTRACT(DAY FROM r_transaction.date) > v_current_month_closing_day THEN
            -- If transaction day is after closing day, it belongs to next month's invoice
            v_closing_date := (date_trunc('month', r_transaction.date) + INTERVAL '1 month' + (v_current_month_closing_day - 1) * INTERVAL '1 day')::date;
        ELSE
            -- Otherwise, it belongs to current month's invoice
            v_closing_date := (date_trunc('month', r_transaction.date) + (v_current_month_closing_day - 1) * INTERVAL '1 day')::date;
        END IF;

        -- Calculate the due date (always in the month following the closing date)
        v_due_date := (date_trunc('month', v_closing_date + INTERVAL '1 month') + (r_transaction.due_day - 1) * INTERVAL '1 day')::date;

        -- Find or create the invoice for this closing date
        SELECT id INTO v_invoice_id FROM public.invoices
        WHERE account_id = r_transaction.account_id AND closing_date = v_closing_date;

        IF v_invoice_id IS NULL THEN
            INSERT INTO public.invoices (user_id, account_id, closing_date, due_date, status)
            VALUES (v_user_id, r_transaction.account_id, v_closing_date, v_due_date, 'open')
            RETURNING id INTO v_invoice_id;
        END IF;

        -- Update the transaction with the correct invoice_id
        UPDATE public.transactions
        SET invoice_id = v_invoice_id
        WHERE id = r_transaction.id;
    END LOOP;

    -- Update total_amount for already paid invoices
    FOR r_transaction IN
        SELECT i.id AS invoice_id, i.account_id, i.user_id
        FROM public.invoices i
        WHERE i.status = 'paid' AND i.total_amount IS NULL
    LOOP
        -- Recalculate total for paid invoices
        UPDATE public.invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount * -1), 0)
            FROM public.transactions
            WHERE invoice_id = r_transaction.invoice_id AND user_id = r_transaction.user_id
        )
        WHERE id = r_transaction.invoice_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;