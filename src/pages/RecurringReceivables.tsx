import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecurringReceivable } from "@/types/receivable";
import { AddRecurringReceivableDialog } from "@/components/AddRecurringReceivableDialog";
import { RecurringReceivableItem } from "@/components/RecurringReceivableItem";
import { Loader2, Repeat } from "lucide-react";

const getRecurringReceivables = async (): Promise<RecurringReceivable[]> => {
  const { data, error } = await supabase
    .from("recurring_receivables")
    .select("*")
    .order("due_day", { ascending: true });

  if (error) throw new Error(error.message);
  return data as RecurringReceivable[];
};

const RecurringReceivables = () => {
  const { data: recurringReceivables, isLoading } = useQuery({
    queryKey: ["recurring_receivables"],
    queryFn: getRecurringReceivables,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Recebimentos Recorrentes</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus recebimentos que se repetem mensalmente.
          </p>
        </div>
        <AddRecurringReceivableDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : recurringReceivables && recurringReceivables.length > 0 ? (
        <div className="bg-card rounded-lg">
          <div className="divide-y divide-border">
            {recurringReceivables.map((item) => (
              <RecurringReceivableItem key={item.id} receivable={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <Repeat className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhum recebimento recorrente</h3>
          <p className="text-gray-400">Adicione um recebimento que se repete todo mês.</p>
        </div>
      )}
    </div>
  );
};

export default RecurringReceivables;