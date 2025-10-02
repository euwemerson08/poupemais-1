CREATE OR REPLACE FUNCTION public.get_transactions_by_month_with_installments(p_month INT, p_year INT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    account_id UUID,
    description TEXT,
    amount NUMERIC,
    date DATE,
    is_paid BOOLEAN,
    is_installment BOOLEAN,
    installment_number INT,
    total_installments INT,
    original_purchase_id UUID,
    invoice_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    category_name TEXT,
    category_icon TEXT,
    account_name TEXT,
    account_type TEXT,
    account_balance NUMERIC,
    account_color TEXT,
    account_icon TEXT,
    account_limit NUMERIC,
    account_closing_day INT,
    account_due_day INT,
    invoice_closing_date DATE,
    invoice_due_date DATE,
    invoice_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.user_id,
        t.account_id,
        t.description,
        t.amount,
        t.date,
        t.is_paid,
        t.is_installment,
        t.installment_number,
        t.total_installments,
        t.original_purchase_id,
        t.invoice_id,
        t.created_at,
        t.category_name,
        t.category_icon,
        a.name AS account_name,
        a.type AS account_type,
        a.balance AS account_balance,
        a.color AS account_color,
        a.icon AS account_icon,
        a.limit AS account_limit,
        a.closing_day AS account_closing_day,
        a.due_day AS account_due_day,
        i.closing_date AS invoice_closing_date,
        i.due_date AS invoice_due_date,
        i.status AS invoice_status
    FROM
        public.transactions t
    LEFT JOIN
        public.accounts a ON t.account_id = a.id
    LEFT JOIN
        public.invoices i ON t.invoice_id = i.id
    WHERE
        t.user_id = auth.uid()
        AND (
            (t.is_installment = TRUE AND EXTRACT(MONTH FROM i.due_date) = p_month AND EXTRACT(YEAR FROM i.due_date) = p_year)
            OR
            (t.is_installment = FALSE AND EXTRACT(MONTH FROM t.date) = p_month AND EXTRACT(YEAR FROM t.date) = p_year)
        )
        AND (i.status IS NULL OR i.status <> 'paid') -- Adicionado: Exclui transações de faturas pagas
    ORDER BY
        COALESCE(i.due_date, t.date) DESC;
END;
$function$;