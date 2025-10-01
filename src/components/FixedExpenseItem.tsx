import {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal, LucideIcon, MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FixedExpense } from "@/types/fixedExpense";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { DeleteFixedExpenseDialog } from "./DeleteFixedExpenseDialog";
import { EditFixedExpenseDialog } from "./EditFixedExpenseDialog";

const categoryIconMap: { [key: string]: LucideIcon } = {
  'Alimentação': UtensilsCrossed, 'Moradia': Home, 'Transporte': Car, 'Lazer': Film,
  'Saúde': HeartPulse, 'Compras': ShoppingCart, 'Educação': GraduationCap, 'Viagens': Plane,
  'Presentes': Gift, 'Serviços': Wrench, 'Pagamentos': Landmark, 'Outros': MoreHorizontal,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const deleteFixedExpense = async (id: string) => {
  const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

interface FixedExpenseItemProps {
  expense: FixedExpense;
}

export const FixedExpenseItem = ({ expense }: FixedExpenseItemProps) => {
  const Icon = categoryIconMap[expense.category_name] || MoreHorizontal;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: () => {
      showSuccess("Despesa fixa excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir despesa: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate(expense.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{expense.description}</p>
            <p className="text-sm text-gray-400">Vence todo dia {expense.due_day}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-semibold">{formatCurrency(expense.amount)}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-white p-1 rounded-full">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsDeleteDialogOpen(true)}
                className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DeleteFixedExpenseDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
      {isEditDialogOpen && (
        <EditFixedExpenseDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          expense={expense}
        />
      )}
    </>
  );
};