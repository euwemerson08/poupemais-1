import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FixedExpense } from "@/types/fixedExpense";
import { AddFixedExpenseDialog } from "@/components/AddFixedExpenseDialog";
import { FixedExpenseItem } from "@/components/FixedExpenseItem";
import { Loader2 } from "lucide-react";

const getFixedExpenses = async (): Promise<FixedExpense[]> => {
  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*, accounts(*)")
    .order("due_day", { ascending: true });

  if (error) throw new Error(error.message);
  return data as FixedExpense[];
};

const FixedExpenses = () => {
  const { data: fixedExpenses, isLoading } = useQuery({
    queryKey: ["fixed_expenses"],
    queryFn: getFixedExpenses,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Despesas Fixas</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus gastos recorrentes, como aluguel e assinaturas.
          </p>
        </div>
        <AddFixedExpenseDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-lg">
          <div className="divide-y divide-border">
            {fixedExpenses?.map((expense) => (
              <FixedExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedExpenses;