import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Edit, Trash, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receivable } from "@/types/receivable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { MarkAsReceivedDialog } from "./MarkAsReceivedDialog";
import { EditReceivableDialog } from "./EditReceivableDialog";
import { cn } from "@/lib/utils"; // Importação adicionada para usar cn

interface ReceivableItemProps {
  receivable: Receivable;
  isRecurringTemplate?: boolean;
}

// Função para traduzir o intervalo de recorrência
const translateRecurrenceInterval = (interval: string | undefined) => {
  switch (interval) {
    case 'daily':
      return 'Diário';
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensal';
    case 'yearly':
      return 'Anual';
    default:
      return interval; // Retorna o original se não houver tradução
  }
};

export const ReceivableItem = ({ receivable, isRecurringTemplate = false }: ReceivableItemProps) => {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReceivedDialogOpen, setIsReceivedDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isRecurringTemplate) {
        const { error } = await supabase.rpc('delete_recurring_receivable', { p_recurring_receivable_id: id });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.rpc('delete_receivable', { p_receivable_id: id });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      showSuccess("Recebimento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_receivables"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir recebimento: ${err.message}`);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(receivable.id);
  };

  // Ajuste aqui: usar variants existentes e classes Tailwind para cores
  const statusBadgeClass = receivable.status === "received" ? "bg-green-600 hover:bg-green-600/80" : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30";

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b last:border-b-0"> {/* Ajustado para responsividade */}
        <div className="flex-1 min-w-0"> {/* Changed to flex-1 min-w-0 */}
          <p className="font-medium text-lg truncate">{receivable.description}</p> {/* Adicionado truncate */}
          <p className="text-sm text-muted-foreground truncate"> {/* Adicionado truncate */}
            {isRecurringTemplate ? (
              `Início: ${format(parseISO(receivable.due_date), "dd/MM/yyyy", { locale: ptBR })} - Intervalo: ${translateRecurrenceInterval(receivable.recurrence_interval)}`
            ) : (
              `Vencimento: ${format(parseISO(receivable.due_date), "dd/MM/yyyy", { locale: ptBR })}`
            )}
          </p>
          {receivable.category_name && (
            <Badge variant="secondary" className="mt-1">
              {receivable.category_name}
            </Badge>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0 flex-shrink-0"> {/* Adjusted for stacking on small screens */}
          <p className="font-semibold text-lg text-green-600">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(receivable.amount)}
          </p>
          <div className="flex items-center space-x-2">
            {!isRecurringTemplate && (
              <Badge variant="default" className={cn(statusBadgeClass)}> {/* Usando variant="default" e classe customizada */}
                {receivable.status === "pending" ? "Pendente" : "Recebido"}
              </Badge>
            )}

            {(receivable.status === 'pending' || isRecurringTemplate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReceivedDialogOpen(true)}
                className="flex items-center"
              >
                <CheckCircle className="mr-1 h-4 w-4" /> Receber
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
      <MarkAsReceivedDialog
        open={isReceivedDialogOpen}
        onOpenChange={setIsReceivedDialogOpen}
        receivable={receivable}
      />
      {isEditDialogOpen && (
        <EditReceivableDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          receivable={receivable}
          isRecurringTemplate={isRecurringTemplate}
        />
      )}
    </>
  );
};