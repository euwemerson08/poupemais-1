import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { TransactionItem } from "@/components/TransactionItem";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, accounts(id, name, type)")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Transaction[];
};

const Transactions = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-gray-400 mt-1">
            Registre e visualize suas receitas e despesas.
          </p>
        </div>
        <div className="flex gap-2">
          <AddExpenseDialog />
          <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Receita
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-lg">
          <div className="divide-y divide-border px-6">
            {transactions?.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;