CREATE OR REPLACE FUNCTION public.pay_invoice(invoice_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_id_param UUID := auth.uid();
  v_account_id UUID;
BEGIN
  -- Obtém o account_id associado à fatura
  SELECT account_id INTO v_account_id FROM public.invoices WHERE id = invoice_id_param AND user_id = user_id_param;

  -- Atualiza o status da fatura para 'paga'
  UPDATE public.invoices
  SET status = 'paid'
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