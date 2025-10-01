import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecurringReceivable } from "@/types/receivable";
import { format, parseISO } from "date-fns";
import { MoreVertical, LucideIcon, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showError, showSuccess } from "@/utils/toast";
import { DeleteRecurringReceivableDialog } from "./DeleteRecurringReceivableDialog";
import { EditRecurringReceivableDialog } from "./EditRecurringReceivableDialog";
import { categories } from "./CategoryPicker";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const deleteRecurringReceivable = async (id: string) => {
  const { error } = await supabase.from("recurring_receivables").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

interface RecurringReceivableItemProps {
  receivable: RecurringReceivable;
}

export const RecurringReceivableItem = ({ receivable }: RecurringReceivableItemProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const category = categories.find(c => c.name === receivable.category_name);
  const Icon: LucideIcon = category?.icon || MoreHorizontal;
  const categoryColor = category?.color || '#6B7280'; // Default gray

  const deleteMutation = useMutation({
    mutationFn: deleteRecurringReceivable,
    onSuccess: () => {
      showSuccess("Recebimento recorrente excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["recurring_receivables"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir recebimento recorrente: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate(receivable.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${categoryColor}20` }}>
            <Icon className="h-5 w-5" style={{ color: categoryColor }} />
          </div>
          <div>
            <p className="font-medium">{receivable.description}</p>
            <p className="text-sm text-gray-400">
              Vence todo dia {receivable.due_day} · Início: {format(parseISO(receivable.start_date), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-lg">{formatCurrency(receivable.amount)}</p>
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
      {isEditDialogOpen && (
        <EditRecurringReceivableDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          receivable={receivable}
        />
      )}
      <DeleteRecurringReceivableDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};