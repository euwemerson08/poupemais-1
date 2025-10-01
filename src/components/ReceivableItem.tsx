import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receivable } from "@/types/receivable";
import { format, parseISO, isPast } from "date-fns";
import { MoreVertical, CheckCircle, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { MarkAsReceivedDialog } from "./MarkAsReceivedDialog";
// Placeholder for future components
// import { EditReceivableDialog } from "./EditReceivableDialog";
// import { DeleteReceivableDialog } from "./DeleteReceivableDialog";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

interface ReceivableItemProps {
  receivable: Receivable;
}

export const ReceivableItem = ({ receivable }: ReceivableItemProps) => {
  const [isReceivedDialogOpen, setIsReceivedDialogOpen] = useState(false);
  const isOverdue = isPast(parseISO(receivable.due_date)) && receivable.status === 'pending';

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-medium">{receivable.description}</p>
            <p className={`text-sm ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
              Vence em: {format(parseISO(receivable.due_date), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-semibold text-lg">{formatCurrency(receivable.amount)}</p>
          <Badge variant={receivable.status === 'received' ? 'default' : 'outline'} className={receivable.status === 'received' ? 'bg-green-600/20 text-green-400 border-green-600/30' : isOverdue ? 'border-red-500/30 text-red-400' : ''}>
            {receivable.status === 'received' ? 'Recebido' : isOverdue ? 'Vencido' : 'Pendente'}
          </Badge>
          {receivable.status === 'pending' && (
            <Button size="sm" onClick={() => setIsReceivedDialogOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Receber
            </Button>
          )}
        </div>
      </div>
      {isReceivedDialogOpen && (
        <MarkAsReceivedDialog
          receivable={receivable}
          open={isReceivedDialogOpen}
          onOpenChange={setIsReceivedDialogOpen}
        />
      )}
    </>
  );
};