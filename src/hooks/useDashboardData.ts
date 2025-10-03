import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Account } from "@/types/account";
import { Transaction } from "@/types/transaction";
import { format, subMonths, getMonth, getYear, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlySummary {
  name: string;
  Receitas: number;
  Despesas: number;
}

const getDashboardData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const today = new Date();
  const startOfCurrentMonth = format(startOfMonth(today), "yyyy-MM-dd");
  const endOfCurrentMonth = format(endOfMonth(today), "yyyy-MM-dd");

  // 1. Saldo Total
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("id, name, type, balance, closing_day");
  if (accountsError) {
    showError("Erro ao buscar saldo total.");
    throw new Error(accountsError.message);
  }
  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit_card') {
      return sum - acc.balance;
    }
    return sum + acc.balance;
  }, 0);

  // --- NOVA LÓGICA PARA "RECEITA DO MÊS" ---
  // 1. Somar os saldos atuais da Carteira (Wallet) e Conta Digital (Checking)
  let totalWalletCheckingBalance = 0;
  accounts.forEach(acc => {
    if (acc.type === 'wallet' || acc.type === 'checking') {
      totalWalletCheckingBalance += acc.balance;
    }
  });

  // 2. Calcular Despesas do Mês (fixas + avulsas + faturas de cartão)
  // Despesas Fixas
  const { data: fixedExpenses, error: fixedExpensesError } = await supabase
    .from("fixed_expenses")
    .select("amount");
  if (fixedExpensesError) {
    showError("Erro ao buscar despesas fixas.");
    throw new Error(fixedExpensesError.message);
  }
  const totalFixedExpensesAmount = fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);

  // Transações não-cartão de crédito para o mês atual (apenas despesas)
  const { data: monthlyTransactions, error: monthlyTransactionsError } = await supabase
    .from("transactions")
    .select("amount, account_id")
    .gte("date", startOfCurrentMonth)
    .lte("date", endOfCurrentMonth);
  if (monthlyTransactionsError) {
    showError("Erro ao buscar transações do mês.");
    throw new Error(monthlyTransactionsError.message);
  }

  let monthlyExpensesNonCC = 0;
  const creditCardAccountIds = new Set(accounts.filter(acc => acc.type === 'credit_card').map(acc => acc.id));

  monthlyTransactions.forEach(tx => {
    if (!creditCardAccountIds.has(tx.account_id)) {
      if (tx.amount < 0) { // Apenas valores negativos são despesas
        monthlyExpensesNonCC += Math.abs(tx.amount);
      }
    }
  });

  // Despesas de Faturas de Cartão de Crédito para o mês atual
  let totalCreditCardInvoiceExpenses = 0;
  const creditCards = accounts.filter(acc => acc.type === 'credit_card');

  for (const card of creditCards) {
    if (!card.closing_day) continue;

    let targetClosingDate: Date;
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const effectiveClosingDay = Math.min(card.closing_day, lastDayOfCurrentMonth);

    if (currentDay > effectiveClosingDay) {
      targetClosingDate = new Date(currentYear, currentMonth + 1, effectiveClosingDay);
    } else {
      targetClosingDate = new Date(currentYear, currentMonth, effectiveClosingDay);
    }
    targetClosingDate.setHours(0, 0, 0, 0);

    const { data: currentInvoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, transactions(amount)")
      .eq("account_id", card.id)
      .eq("closing_date", format(targetClosingDate, "yyyy-MM-dd"))
      .eq("status", "open")
      .single();

    if (invoiceError && invoiceError.code !== 'PGRST116') {
      showError(`Erro ao buscar fatura atual para ${card.name}.`);
      throw new Error(invoiceError.message);
    }

    if (currentInvoiceData) {
      const invoiceExpenses = currentInvoiceData.transactions.reduce((sum, tx) => {
        return sum + Math.abs(tx.amount);
      }, 0);
      totalCreditCardInvoiceExpenses += invoiceExpenses;
    }
  }

  const totalGrossExpenses = totalFixedExpensesAmount + monthlyExpensesNonCC + totalCreditCardInvoiceExpenses;

  // "Receita do Mês" = (Saldo atual da Carteira + Saldo atual da Conta Digital) - Despesas do Mês
  const netMonthlyResult = totalWalletCheckingBalance - totalGrossExpenses;
  // --- FIM DA NOVA LÓGICA PARA "RECEITA DO MÊS" ---

  // 3. Total a Receber (todos os recebíveis pendentes, independentemente do mês)
  const { data: allPendingReceivables, error: allReceivablesError } = await supabase
    .from("receivables")
    .select("amount")
    .eq("status", "pending");
  if (allReceivablesError) {
    showError("Erro ao buscar todas as contas a receber.");
    throw new Error(allReceivablesError.message);
  }
  let totalReceivablesAmount = allPendingReceivables.reduce((sum, r) => sum + r.amount, 0);

  const { data: allRecurringReceivables, error: allRecurringReceivablesError } = await supabase
    .from("recurring_receivables")
    .select("amount")
    .or(`end_date.is.null,end_date.gte.${format(today, "yyyy-MM-dd")}`);
  
  if (allRecurringReceivablesError) {
    showError("Erro ao buscar todos os recebimentos recorrentes.");
    throw new Error(allRecurringReceivablesError.message);
  }

  const allTotalRecurringReceivablesAmount = allRecurringReceivables.reduce((sum, rr) => sum + rr.amount, 0);
  totalReceivablesAmount += allTotalRecurringReceivablesAmount;

  // 4. Dados para o OverviewChart (últimos 6 meses) - Mantém a lógica de fluxo de caixa mensal
  const chartData: MonthlySummary[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(today, i);
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

    const { data: periodTransactions, error: periodTransactionsError } = await supabase
      .from("transactions")
      .select("amount, account_id")
      .gte("date", monthStart)
      .lte("date", monthEnd);

    if (periodTransactionsError) {
      showError(`Erro ao buscar transações para o mês ${format(month, "MMM", { locale: ptBR })}.`);
      throw new Error(periodTransactionsError.message);
    }

    let periodIncome = 0;
    let periodExpenses = totalFixedExpensesAmount; // Adiciona despesas fixas a cada mês para o gráfico

    const periodCreditCardAccountIds = new Set(accounts.filter(acc => acc.type === 'credit_card').map(acc => acc.id));

    for (const tx of periodTransactions) {
      if (!periodCreditCardAccountIds.has(tx.account_id)) {
        if (tx.amount > 0) {
          periodIncome += tx.amount;
        } else {
          periodExpenses += Math.abs(tx.amount);
        }
      }
    }

    let periodCreditCardInvoiceExpenses = 0;
    for (const card of creditCards) {
      if (!card.closing_day) continue;

      let chartTargetClosingDate: Date;
      const chartCurrentDay = month.getDate();
      const chartCurrentMonth = month.getMonth();
      const chartCurrentYear = month.getFullYear();

      const chartLastDayOfCurrentMonth = new Date(chartCurrentYear, chartCurrentMonth + 1, 0).getDate();
      const chartEffectiveClosingDay = Math.min(card.closing_day, chartLastDayOfCurrentMonth);

      if (chartCurrentDay > chartEffectiveClosingDay) {
        chartTargetClosingDate = new Date(chartCurrentYear, chartCurrentMonth + 1, chartEffectiveClosingDay);
      } else {
        chartTargetClosingDate = new Date(chartCurrentYear, chartCurrentMonth, chartEffectiveClosingDay);
      }
      chartTargetClosingDate.setHours(0, 0, 0, 0);

      const { data: chartInvoiceData, error: chartInvoiceError } = await supabase
        .from("invoices")
        .select("*, transactions(amount)")
        .eq("account_id", card.id)
        .eq("closing_date", format(chartTargetClosingDate, "yyyy-MM-dd"))
        .eq("status", "open")
        .single();

      if (chartInvoiceError && chartInvoiceError.code !== 'PGRST116') {
        showError(`Erro ao buscar fatura para o gráfico para ${card.name}.`);
        throw new Error(chartInvoiceError.message);
      }

      if (chartInvoiceData) {
        const chartInvoiceExpenses = chartInvoiceData.transactions.reduce((sum, tx) => {
          return sum + Math.abs(tx.amount);
        }, 0);
        periodCreditCardInvoiceExpenses += chartInvoiceExpenses;
      }
    }
    periodExpenses += periodCreditCardInvoiceExpenses;

    const { data: chartPendingReceivables, error: chartReceivablesError } = await supabase
      .from("receivables")
      .select("amount")
      .eq("status", "pending")
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd);
    if (chartReceivablesError) {
      showError("Erro ao buscar contas a receber para o gráfico.");
      throw new Error(chartReceivablesError.message);
    }
    let chartTotalReceivablesAmount = chartPendingReceivables.reduce((sum, r) => sum + r.amount, 0);

    const { data: chartRecurringReceivables, error: chartRecurringReceivablesError } = await supabase
      .from("recurring_receivables")
      .select("amount")
      .lte("start_date", monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`)
      .eq("recurrence_interval", "monthly");
    
    if (chartRecurringReceivablesError) {
      showError("Erro ao buscar recebimentos recorrentes para o gráfico.");
      throw new Error(chartRecurringReceivablesError.message);
    }

    const chartTotalRecurringReceivablesAmount = chartRecurringReceivables.reduce((sum, rr) => sum + rr.amount, 0);
    chartTotalReceivablesAmount += chartTotalRecurringReceivablesAmount;

    periodIncome += chartTotalReceivablesAmount;

    chartData.push({
      name: format(month, "MMM", { locale: ptBR }),
      Receitas: periodIncome,
      Despesas: periodExpenses,
    });
  }

  // 5. Transações Recentes
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
    monthlyIncome: netMonthlyResult, // Agora é (Saldo atual da Carteira + Saldo atual da Conta Digital) - Despesas do Mês
    monthlyExpenses: totalGrossExpenses, // Total de despesas brutas do mês
    totalReceivablesAmount, // Total de todos os recebíveis pendentes
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