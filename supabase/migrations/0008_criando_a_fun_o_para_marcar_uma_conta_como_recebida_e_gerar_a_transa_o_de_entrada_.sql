-- Function to mark a receivable as received and create an income transaction
CREATE OR REPLACE FUNCTION public.mark_receivable_as_received(p_receivable_id uuid, p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_receivable RECORD;
BEGIN
    -- Find the receivable and ensure it belongs to the user and is pending
    SELECT * INTO v_receivable FROM public.receivables
    WHERE id = p_receivable_id AND user_id = v_user_id AND status = 'pending';

    IF v_receivable IS NULL THEN
        RAISE EXCEPTION 'Conta a receber não encontrada, já foi recebida ou permissão negada.';
    END IF;

    -- Update the receivable status
    UPDATE public.receivables
    SET status = 'received', received_at = now()
    WHERE id = p_receivable_id;

    -- Add the amount to the selected account's balance
    UPDATE public.accounts
    SET balance = balance + v_receivable.amount
    WHERE id = p_account_id AND user_id = v_user_id;

    -- Insert the income transaction
    INSERT INTO public.transactions (user_id, account_id, description, amount, date, is_paid, category_name, category_icon)
    VALUES (v_user_id, p_account_id, v_receivable.description, v_receivable.amount, v_receivable.due_date, true, 'Recebimentos', 'Landmark');
END;
$$;