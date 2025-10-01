-- Create function to add value to a financial plan
CREATE OR REPLACE FUNCTION public.add_to_financial_plan(p_plan_id uuid, p_amount_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.financial_plans
  SET current_amount = current_amount + p_amount_to_add
  WHERE id = p_plan_id AND user_id = auth.uid();
END;
$$;