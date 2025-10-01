import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialPlan } from "@/types/financialPlan";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddValueToPlanDialog } from "./AddValueToPlanDialog";
import { DeletePlanDialog } from "./DeletePlanDialog";
import { EditPlanDialog } from "./EditPlanDialog";
import { showError, showSuccess } from "@/utils/toast";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const deletePlan = async (id: string) => {
  const { error } = await supabase.from("financial_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

interface FinancialPlanCardProps {
  plan: FinancialPlan;
}

export const FinancialPlanCard = ({ plan }: FinancialPlanCardProps) => {
  const [isAddValueOpen, setIsAddValueOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const progress = (plan.current_amount / plan.goal_amount) * 100;

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      showSuccess("Plano excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["financial_plans"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir plano: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate(plan.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="bg-card border-border flex flex-col">
        <CardHeader className="flex-row items-start justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-red-500">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(plan.current_amount)}</p>
            <p className="text-sm text-gray-400">Meta: {formatCurrency(plan.goal_amount)}</p>
          </div>
          <div>
            <Progress value={progress} className="h-2 [&>div]:bg-[#E63980]" />
            <p className="text-right text-sm text-gray-400 mt-1">{progress.toFixed(1)}%</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => setIsAddValueOpen(true)}>
            Adicionar Valor
          </Button>
        </CardFooter>
      </Card>

      {isAddValueOpen && <AddValueToPlanDialog plan={plan} open={isAddValueOpen} onOpenChange={setIsAddValueOpen} />}
      {isEditDialogOpen && <EditPlanDialog plan={plan} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />}
      <DeletePlanDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} />
    </>
  );
};