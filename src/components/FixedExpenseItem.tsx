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
import { cn } from "@/lib/utils";

const categoryIconMap: { [key: string]: LucideIcon } = {
  'Alimentação': UtensilsCrossed, 'Moradia': Home, 'Transporte': Car, 'Lazer': Film,
  'Saúde': HeartPulse, 'Compras': ShoppingCart, 'Educação': GraduationCap, 'Viagens': Plane,
  'Presentes': Gift, 'Serviços': Wrench, 'Pagamentos': Landmark, 'Outros': MoreHorizontal,
};

const categoryStyles: { [key: string]: { bg: string; text: string } } = {
  'Alimentação': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  'Moradia': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  'Transporte': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'Lazer': { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  'Saúde': { bg: 'bg-red-500/20', text: 'text-red-400' },
  'Compras': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'Educação': { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  'Viagens': { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  'Presentes': { bg: 'bg-green-500/20', text: 'text-green-400' },
  'Serviços': { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  'Pagamentos': { bg: 'bg-lime-500/20', text: 'text-lime-400' },
  'Outros': { bg: 'bg-gray-500/20', text: 'text-gray-400' },
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
  const styles = categoryStyles[expense.category_name] || categoryStyles['Outros'];
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
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", styles.bg)}>
            <Icon className={cn("h-5 w-5", styles.text)} />
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