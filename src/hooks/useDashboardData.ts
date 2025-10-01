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
    // Para cartões de crédito, o balance é a fatura, que é uma despesa.
    // Para o saldo total, consideramos o limite disponível menos a fatura.
    // Ou, se for uma conta normal, apenas o saldo.
    if (acc.type === 'credit_card') {
      // Se o balance for negativo (fatura), ele já está subtraído do limite.
      // Se o balance for positivo (crédito), ele adiciona ao limite.
      // Para o saldo total, vamos considerar o balance como uma dívida (negativo)
      // ou um crédito (positivo) que afeta o saldo geral.
      // Simplificando para o dashboard, vamos considerar o 'balance' do cartão como uma dívida a ser paga.
      // Então, ele subtrai do saldo geral.
      return sum + acc.balance;
    }
    return sum + acc.balance;
  }, 0);


  // 2. Receitas e Despesas do Mês
  const startOfCurrentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endOfCurrentMonth = format(endOfMonth(new Date()), "yyyy-MM-dd");

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
  let monthlyExpenses = 0;
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
    let periodExpenses = 0;
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