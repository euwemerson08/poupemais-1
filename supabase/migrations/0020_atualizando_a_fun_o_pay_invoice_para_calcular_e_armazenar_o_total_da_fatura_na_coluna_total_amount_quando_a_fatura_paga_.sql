CREATE OR REPLACE FUNCTION public.pay_invoice(invoice_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_id_param UUID := auth.uid();
  v_account_id UUID;
  v_invoice_total NUMERIC := 0;
BEGIN
  -- Obtém o account_id associado à fatura
  SELECT account_id INTO v_account_id FROM public.invoices WHERE id = invoice_id_param AND user_id = user_id_param;

  -- Calcula o valor total da fatura antes de marcar as transações como pagas
  SELECT COALESCE(SUM(amount * -1), 0) INTO v_invoice_total
  FROM public.transactions
  WHERE invoice_id = invoice_id_param AND user_id = user_id_param;

  -- Atualiza o status da fatura para 'paga' e armazena o total calculado
  UPDATE public.invoices
  SET status = 'paid', total_amount = v_invoice_total
  WHERE id = invoice_id_param AND user_id = user_id_param;

  -- Atualiza todas as transações associadas para 'pagas'
  UPDATE public.transactions
  SET is_paid = true
  WHERE invoice_id = invoice_id_param AND user_id = user_id_param;

  -- Recalcula o saldo do cartão de crédito após o pagamento
  IF v_account_id IS NOT NULL THEN
      PERFORM public.recalculate_credit_card_balance(v_account_id);
  END IF;
END;
$function$;