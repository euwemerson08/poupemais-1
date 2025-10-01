import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { FinancialPlan, AddValueFormData, addValueSchema } from "@/types/financialPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const addValueToPlan = async ({ planId, amount }: { planId: string; amount: number }) => {
  const { error } = await supabase.rpc('add_to_financial_plan', {
    p_plan_id: planId,
    p_amount_to_add: amount,
  });
  if (error) throw new Error(error.message);
};

interface AddValueToPlanDialogProps {
  plan: FinancialPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddValueToPlanDialog = ({ plan, open, onOpenChange }: AddValueToPlanDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddValueFormData>({
    resolver: zodResolver(addValueSchema),
  });

  const mutation = useMutation({
    mutationFn: addValueToPlan,
    onSuccess: () => {
      showSuccess("Valor adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financial_plans"] });
      onOpenChange(false);
      reset();
    },
    onError: (err) => {
      showError(`Erro ao adicionar valor: ${err.message}`);
    },
  });

  const onSubmit = (data: AddValueFormData) => {
    mutation.mutate({ planId: plan.id, amount: data.amount });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Valor a {plan.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor a Adicionar</Label>
            <Input id="amount" {...register("amount")} placeholder="R$ 0,00" className="bg-background" />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};