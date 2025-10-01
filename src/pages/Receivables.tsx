import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receivable, RecurringReceivable } from "@/types/receivable"; // Import RecurringReceivable
import { AddReceivableDialog } from "@/components/AddReceivableDialog";
import { ReceivableItem } from "@/components/ReceivableItem";
import { Loader2, FileText } from "lucide-react";
import { format } from "date-fns"; // Necessário para formatar datas de recorrentes

const getReceivablesAndRecurring = async (): Promise<Receivable[]> => {
  const { data: oneTimeReceivables, error: oneTimeError } = await supabase
    .from("receivables")
    .select("*")
    .order("due_date", { ascending: true });

  if (oneTimeError) {
    throw new Error(oneTimeError.message);
  }

  const { data: recurringReceivables, error: recurringError } = await supabase
    .from("recurring_receivables")
    .select("*")
    .order("start_date", { ascending: true });

  if (recurringError) {
    throw new Error(recurringError.message);
  }

  const combinedReceivables: Receivable[] = [];

  // Adicionar recebimentos únicos
  if (oneTimeReceivables) {
    combinedReceivables.push(...(oneTimeReceivables as Receivable[]));
  }

  // Adicionar recebimentos recorrentes como templates
  if (recurringReceivables) {
    const mappedRecurring: Receivable[] = (recurringReceivables as RecurringReceivable[]).map(rr => ({
      id: rr.id,
      description: rr.description,
      amount: rr.amount,
      due_date: rr.start_date, // Usar start_date como due_date para exibição
      status: 'recurring_template', // Novo status para templates
      received_at: null,
      category_name: rr.category_name,
      category_icon: rr.category_icon,
      is_recurring_template: true,
      recurrence_interval: rr.recurrence_interval,
      recurrence_end_date: rr.end_date,
    }));
    combinedReceivables.push(...mappedRecurring);
  }

  // Ordenar todos por due_date (ou start_date para templates recorrentes)
  combinedReceivables.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  return combinedReceivables;
};

const Receivables = () => {
  const { data: receivables, isLoading } = useQuery({
    queryKey: ["receivables", "recurring_receivables"], // Invalidar ambas as queries
    queryFn: getReceivablesAndRecurring,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus recebimentos futuros e valores a receber.
          </p>
        </div>
        <AddReceivableDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : receivables && receivables.length > 0 ? (
        <div className="bg-card rounded-lg">
          <div className="divide-y divide-border">
            {receivables.map((item) => (
              <ReceivableItem key={item.id} receivable={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <FileText className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma conta a receber</h3>
          <p className="text-gray-400">Você não tem nenhum recebimento pendente.</p>
        </div>
      )}
    </div>
  );
};

export default Receivables;