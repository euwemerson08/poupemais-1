import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receivable } from "@/types/receivable";
import { format, parseISO, isPast } from "date-fns";
import { MoreVertical, CheckCircle, LucideIcon, MoreHorizontal, Repeat } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { MarkAsReceivedDialog } from "./MarkAsReceivedDialog";
import { DeleteReceivableDialog } from "./DeleteReceivableDialog";
import { EditReceivableDialog } from "./EditReceivableDialog";
import { categories } from "./CategoryPicker";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const deleteReceivable = async (id: string, isRecurring: boolean) => {
  if (isRecurring) {
    const { error } = await supabase.rpc('delete_recurring_receivable', { p_recurring_receivable_id: id });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.rpc('delete_receivable', { p_receivable_id: id });
    if (error) throw new Error(error.message);
  }
};

interface ReceivableItemProps {
  receivable: Receivable;
}

export const ReceivableItem = ({ receivable }: ReceivableItemProps) => {
  const [isReceivedDialogOpen, setIsReceivedDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isRecurringTemplate = receivable.is_recurring_template;
  const isOverdue = !isRecurringTemplate && isPast(parseISO(receivable.due_date)) && receivable.status === 'pending';
  const queryClient = useQueryClient();

  const category = categories.find(c => c.name === receivable.category_name);
  const Icon: LucideIcon = category?.icon || MoreHorizontal;
  const categoryColor = category?.color || '#6B7280'; // Default gray

  const deleteMutation = useMutation({
    mutationFn: ({ id, isRecurring }: { id: string; isRecurring: boolean }) => deleteReceivable(id, isRecurring),
    onSuccess: () => {
      showSuccess("Item excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_receivables"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir item: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ id: receivable.id, isRecurring: !!isRecurringTemplate });
    setIsDeleteDialogOpen(false);
  };

  const getStatusBadge = () => {
    if (isRecurringTemplate) {
      return (
        <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
          <Repeat className="h-3 w-3 mr-1" /> Recorrente
        </Badge>
      );
    }
    if (receivable.status === 'received') {
      return (
        <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30">
          Recebido
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="outline" className="border-red-500/30 text-red-400">
          Vencido
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Pendente
      </Badge>
    );
  };

  const getRecurrenceIntervalText = (interval?: string) => {
    switch (interval) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return '';
    }
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
            <p className={`text-sm ${isOverdue && !isRecurringTemplate ? 'text-red-400' : 'text-gray-400'}`}>
              {isRecurringTemplate ? (
                <>
                  Início: {format(parseISO(receivable.due_date), "dd/MM/yyyy")}
                  {receivable.recurrence_end_date && ` · Fim: ${format(parseISO(receivable.recurrence_end_date), "dd/MM/yyyy")}`}
                  {receivable.recurrence_interval && ` (${getRecurrenceIntervalText(receivable.recurrence_interval)})`}
                </>
              ) : (
                `Vence em: ${format(parseISO(receivable.due_date), "dd/MM/yyyy")}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-semibold text-lg">{formatCurrency(receivable.amount)}</p>
          {getStatusBadge()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-white p-1 rounded-full">
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {(receivable.status === 'pending' || isRecurringTemplate) && (
                <DropdownMenuItem onSelect={() => setIsReceivedDialogOpen(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Receber
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)} disabled={isRecurringTemplate}>
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
      {isReceivedDialogOpen && (
        <MarkAsReceivedDialog
          receivable={receivable}
          open={isReceivedDialogOpen}
          onOpenChange={setIsReceivedDialogOpen}
        />
      )}
      {isEditDialogOpen && !isRecurringTemplate && (
        <EditReceivableDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          receivable={receivable}
        />
      )}
      <DeleteReceivableDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};