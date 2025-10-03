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
    .select("id, name, type, balance, closing_day"); // Select closing_day for invoice calculation
  if (accountsError) {
    showError("Erro ao buscar saldo total.");
    throw new Error(accountsError.message);
  }
  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit_card') {
      // Credit card balance represents debt, so subtract it from total balance
      return sum - acc.balance;
    }
    return sum + acc.balance;
  }, 0);

  // 2. Receitas e Despesas do Mês (Refined)

  // Fixed Expenses for the month (assuming all fixed expenses apply monthly)
  const { data: fixedExpenses, error: fixedExpensesError } = await supabase
    .from("fixed_expenses")
    .select("amount");
  if (fixedExpensesError) {
    showError("Erro ao buscar despesas fixas.");
    throw new Error(fixedExpensesError.message);
  }
  const totalFixedExpensesAmount = fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);

  // Non-credit card transactions for the current month
  const { data: monthlyTransactions, error: monthlyTransactionsError } = await supabase
    .from("transactions")
    .select("amount, account_id")
    .gte("date", startOfCurrentMonth)
    .lte("date", endOfCurrentMonth);
  if (monthlyTransactionsError) {
    showError("Erro ao buscar transações do mês.");
    throw new Error(monthlyTransactionsError.message);
  }

  let monthlyIncomeNonCC = 0;
  let monthlyExpensesNonCC = 0;
  const creditCardAccountIds = new Set(accounts.filter(acc => acc.type === 'credit_card').map(acc => acc.id));

  monthlyTransactions.forEach(tx => {
    if (!creditCardAccountIds.has(tx.account_id)) { // Only count non-credit card transactions here
      if (tx.amount > 0) {
        monthlyIncomeNonCC += tx.amount;
      } else {
        monthlyExpensesNonCC += Math.abs(tx.amount);
      }
    }
  });

  // Credit Card Invoice Expenses for the current month
  let totalCreditCardInvoiceExpenses = 0;
  const creditCards = accounts.filter(acc => acc.type === 'credit_card');

  for (const card of creditCards) {
    if (!card.closing_day) continue;

    let targetClosingDate: Date;
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYear = today.getFullYear();

    // Determine the effective closing day for the current month
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const effectiveClosingDay = Math.min(card.closing_day, lastDayOfCurrentMonth);

    if (currentDay > effectiveClosingDay) {
      // If today is after the closing day, the current open invoice is for the next month's cycle
      targetClosingDate = new Date(currentYear, currentMonth + 1, effectiveClosingDay);
    } else {
      // If today is on or before the closing day, the current open invoice is for the current month's cycle
      targetClosingDate = new Date(currentYear, currentMonth, effectiveClosingDay);
    }
    targetClosingDate.setHours(0, 0, 0, 0); // Normalize for comparison

    const { data: currentInvoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, transactions(amount)")
      .eq("account_id", card.id)
      .eq("closing_date", format(targetClosingDate, "yyyy-MM-dd"))
      .eq("status", "open")
      .single();

    if (invoiceError && invoiceError.code !== 'PGRST116') { // PGRST116 means no rows found
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

  // Final monthly income and expenses
  const monthlyIncome = monthlyIncomeNonCC + totalReceivablesAmount;
  const monthlyExpenses = totalFixedExpensesAmount + monthlyExpensesNonCC + totalCreditCardInvoiceExpenses;


  // 3. Dados para o OverviewChart (últimos 6 meses)
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
    let periodExpenses = totalFixedExpensesAmount; // Add fixed expenses to each month's expenses for chart

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

    // Add credit card invoice expenses for the chart month
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
        .eq("status", "open") // Only open invoices contribute to current month's expenses
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
    totalReceivablesAmount,
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