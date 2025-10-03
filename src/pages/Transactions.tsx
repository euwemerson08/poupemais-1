import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddIncomeDialog } from "@/components/AddIncomeDialog";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthlyTransactionsGroup } from "@/components/MonthlyTransactionsGroup"; // Importar o novo componente

interface GroupedTransactions {
  monthYear: string;
  transactions: Transaction[];
}

const getTransactions = async (): Promise<GroupedTransactions[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, accounts(id, name, type)")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);

  const groupedTransactions: { [key: string]: Transaction[] } = {};
  (data as Transaction[]).forEach(tx => {
    // Use invoice_due_date for installments, otherwise use transaction.date
    const dateToGroup = tx.is_installment && tx.invoice_due_date ? tx.invoice_due_date : tx.date;
    const monthYear = format(parseISO(dateToGroup), "MMMM yyyy", { locale: ptBR });
    if (!groupedTransactions[monthYear]) {
      groupedTransactions[monthYear] = [];
    }
    groupedTransactions[monthYear].push(tx);
  });

  // Convert to an array of { monthYear: string, transactions: Transaction[] } for easier rendering
  const sortedMonths = Object.keys(groupedTransactions).sort((a, b) => {
    // Parse monthYear strings to Date objects for accurate sorting
    const dateA = parseISO(a.replace(/(\w+) (\d{4})/, '01 $1 $2').replace('janeiro', 'January').replace('fevereiro', 'February').replace('março', 'March').replace('abril', 'April').replace('maio', 'May').replace('junho', 'June').replace('julho', 'July').replace('agosto', 'August').replace('setembro', 'September').replace('outubro', 'October').replace('novembro', 'November').replace('dezembro', 'December'));
    const dateB = parseISO(b.replace(/(\w+) (\d{4})/, '01 $1 $2').replace('janeiro', 'January').replace('fevereiro', 'February').replace('março', 'March').replace('abril', 'April').replace('maio', 'May').replace('junho', 'June').replace('julho', 'July').replace('agosto', 'August').replace('setembro', 'September').replace('outubro', 'October').replace('novembro', 'November').replace('dezembro', 'December'));
    return dateB.getTime() - dateA.getTime(); // Descending order (most recent first)
  });

  const result = sortedMonths.map(monthYear => ({
    monthYear,
    transactions: groupedTransactions[monthYear],
  }));

  return result;
};

const Transactions = () => {
  const { data: groupedTransactions, isLoading } = useQuery({
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
          <AddIncomeDialog />
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : groupedTransactions && groupedTransactions.length > 0 ? (
        <section>
          {groupedTransactions.map((group) => (
            <MonthlyTransactionsGroup
              key={group.monthYear}
              monthYear={group.monthYear}
              transactions={group.transactions}
            />
          ))}
        </section>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <Loader2 className="h-12 w-12 text-gray-500 mb-4" /> {/* Usando Loader2 como um ícone genérico para 'nenhuma transação' */}
          <h3 className="text-xl font-semibold">Nenhuma transação encontrada</h3>
          <p className="text-gray-400">Comece adicionando suas receitas e despesas.</p>
        </div>
      )}
    </div>
  );
};

export default Transactions;