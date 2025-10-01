import {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal, LucideIcon, MoreVertical
} from "lucide-react";
import { Transaction } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const iconMap: { [key: string]: LucideIcon } = {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal,
  Briefcase: Briefcase,
};

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(value));
  return value >= 0 ? `+ ${formatted}` : `- ${formatted}`;
};

const deleteTransaction = async (transactionId: string) => {
  const { error } = await supabase.rpc('delete_transaction', { p_transaction_id: transactionId });
  if (error) throw new Error(error.message);
};

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const Icon = transaction.category_icon && iconMap[transaction.category_icon] ? iconMap[transaction.category_icon] : MoreHorizontal;
  const isIncome = transaction.amount >= 0;

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      showSuccess("Transação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir transação: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate(transaction.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between py-4 group">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{transaction.description}</p>
            <p className="text-sm text-gray-400">
              {transaction.accounts?.name} · {format(parseISO(transaction.date), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className={`font-semibold ${isIncome ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(transaction.amount)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem disabled>
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
      <DeleteTransactionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};