import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Account } from "@/types/account";
import { Transaction } from "@/types/transaction";
import { format, subMonths, getMonth, getYear, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlySummary {
  name: string;
  Receitas: number;
  Despesas: number;
}

const getDashboardData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  // 1. Saldo Total
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("balance, type");
  if (accountsError) {
    showError("Erro ao buscar saldo total.");
    throw new Error(accountsError.message);
  }
  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit_card') {
      return sum + acc.balance;
    }
    return sum + acc.balance;
  }, 0);

  // Fetch Fixed Expenses once
  const { data: fixedExpenses, error: fixedExpensesError } = await supabase
    .from("fixed_expenses")
    .select("amount");
  if (fixedExpensesError) {
    showError("Erro ao buscar despesas fixas.");
    throw new Error(fixedExpensesError.message);
  }
  const totalFixedExpensesAmount = fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);

  // 2. Receitas e Despesas do Mês
  const startOfCurrentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endOfCurrentMonth = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // Fetch Pending Receivables for the current month
  const { data: monthlyPendingReceivables, error: receivablesError } = await supabase
    .from("receivables")
    .select("amount")
    .eq("status", "pending")
    .gte("due_date", startOfCurrentMonth)
    .lte("due_date", endOfCurrentMonth);
  if (receivablesError) {
    showError("Erro ao buscar contas a receber do mês.");
    throw new Error(receivablesError.message);
  }
  let totalReceivablesAmount = monthlyPendingReceivables.reduce((sum, r) => sum + r.amount, 0);

  // Fetch Recurring Receivables active in the current month
  const { data: recurringReceivables, error: recurringReceivablesError } = await supabase
    .from("recurring_receivables")
    .select("amount")
    .lte("start_date", endOfCurrentMonth) // Starts before or in current month
    .or(`end_date.is.null,end_date.gte.${startOfCurrentMonth}`) // Ends after or in current month, or never ends
    .eq("recurrence_interval", "monthly"); // Only monthly recurring
  
  if (recurringReceivablesError) {
    showError("Erro ao buscar recebimentos recorrentes.");
    throw new Error(recurringReceivablesError.message);
  }

  const totalRecurringReceivablesAmount = recurringReceivables.reduce((sum, rr) => sum + rr.amount, 0);
  totalReceivablesAmount += totalRecurringReceivablesAmount; // Add recurring to total


  const { data: monthlyTransactions, error: monthlyTransactionsError } = await supabase
    .from("transactions")
    .select("amount")
    .gte("date", startOfCurrentMonth)
    .lte("date", endOfCurrentMonth);
  if (monthlyTransactionsError) {
    showError("Erro ao buscar transações do mês.");
    throw new Error(monthlyTransactionsError.message);
  }

  let monthlyIncome = 0;
  let monthlyExpenses = totalFixedExpensesAmount; // Start with fixed expenses
  monthlyTransactions.forEach(tx => {
    if (tx.amount > 0) {
      monthlyIncome += tx.amount;
    } else {
      monthlyExpenses += Math.abs(tx.amount);
    }
  });

  // 3. Dados para o OverviewChart (últimos 6 meses)
  const chartData: MonthlySummary[] = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const month = subMonths(today, i);
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

    const { data: periodTransactions, error: periodTransactionsError } = await supabase
      .from("transactions")
      .select("amount")
      .gte("date", monthStart)
      .lte("date", monthEnd);

    if (periodTransactionsError) {
      showError(`Erro ao buscar transações para o mês ${format(month, "MMM", { locale: ptBR })}.`);
      throw new Error(periodTransactionsError.message);
    }

    let periodIncome = 0;
    let periodExpenses = totalFixedExpensesAmount; // Add fixed expenses to each month's expenses
    periodTransactions.forEach(tx => {
      if (tx.amount > 0) {
        periodIncome += tx.amount;
      } else {
        periodExpenses += Math.abs(tx.amount);
      }
    });

    chartData.push({
      name: format(month, "MMM", { locale: ptBR }),
      Receitas: periodIncome,
      Despesas: periodExpenses,
    });
  }

  // 4. Transações Recentes
  const { data: recentTransactions, error: recentTransactionsError } = await supabase
    .from("transactions")
    .select("*, accounts(id, name, type)")
    .order("date", { ascending: false })
    .limit(5);
  if (recentTransactionsError) {
    showError("Erro ao buscar transações recentes.");
    throw new Error(recentTransactionsError.message);
  }

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    totalReceivablesAmount, // Agora inclui recebíveis pendentes e recorrentes do mês
    chartData,
    recentTransactions: recentTransactions as Transaction[],
  };
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: getDashboardData,
  });
};