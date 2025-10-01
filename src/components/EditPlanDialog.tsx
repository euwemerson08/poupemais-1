import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { FinancialPlan, FinancialPlanFormData, financialPlanSchema } from "@/types/financialPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const updatePlan = async ({ id, ...planData }: FinancialPlanFormData & { id: string }) => {
  const { error } = await supabase
    .from("financial_plans")
    .update({ name: planData.name, goal_amount: planData.goal_amount })
    .eq("id", id);
  if (error) throw new Error(error.message);
};

interface EditPlanDialogProps {
  plan: FinancialPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPlanDialog = ({ plan, open, onOpenChange }: EditPlanDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FinancialPlanFormData>({
    resolver: zodResolver(financialPlanSchema),
  });

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        goal_amount: plan.goal_amount,
      });
    }
  }, [plan, reset]);

  const mutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      showSuccess("Plano atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financial_plans"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao atualizar plano: ${err.message}`);
    },
  });

  const onSubmit = (data: FinancialPlanFormData) => {
    mutation.mutate({ ...data, id: plan.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Plano: {plan.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Plano</Label>
            <Input id="name" {...register("name")} className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal_amount">Meta</Label>
            <Input id="goal_amount" {...register("goal_amount")} placeholder="R$ 0,00" className="bg-background" />
            {errors.goal_amount && <p className="text-red-500 text-sm">{errors.goal_amount.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};