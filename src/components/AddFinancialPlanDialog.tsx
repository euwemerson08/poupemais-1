import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { FinancialPlanFormData, financialPlanSchema } from "@/types/financialPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

const createPlan = async (planData: FinancialPlanFormData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("financial_plans").insert({
    ...planData,
    user_id: user.id,
    current_amount: 0,
  });
  if (error) throw new Error(error.message);
};

export const AddFinancialPlanDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FinancialPlanFormData>({
    resolver: zodResolver(financialPlanSchema),
  });

  const mutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      showSuccess("Plano criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financial_plans"] });
      setOpen(false);
      reset();
    },
    onError: (err) => {
      showError(`Erro ao criar plano: ${err.message}`);
    },
  });

  const onSubmit = (data: FinancialPlanFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E63980] hover:bg-[#d63374] text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Plano
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano Financeiro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Plano</Label>
            <Input id="name" {...register("name")} placeholder="Ex: Viagem para a Europa" className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal_amount">Meta</Label>
            <Input id="goal_amount" {...register("goal_amount")} placeholder="R$ 20.000,00" className="bg-background" />
            {errors.goal_amount && <p className="text-red-500 text-sm">{errors.goal_amount.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar Plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};