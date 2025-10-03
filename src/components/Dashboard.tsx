import { StatCard } from "./StatCard";
import { OverviewChart } from "./OverviewChart";
import { RecentTransactions } from "./RecentTransactions";
import { ArrowUp, ArrowDown, Loader2, Wallet } from "lucide-react"; // Importar Wallet para o ícone
import { useDashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const Dashboard = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Erro ao carregar dados do dashboard: {error.message}</p>
      </div>
    );
  }

  const monthlyIncomeValue = data?.monthlyIncome ?? 0;
  const monthlyExpensesValue = data?.monthlyExpenses ?? 0;

  return (
    <div>
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Bem-vindo(a) de volta! Aqui está um resumo das suas finanças.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard
          title="Saldo Total"
          amount={formatCurrency(data?.totalBalance ?? 0)}
        />
        <StatCard
          title="Receitas do Mês"
          amount={formatCurrency(monthlyIncomeValue)}
          icon={monthlyIncomeValue >= 0 ? <ArrowUp className="text-green-500" /> : <ArrowDown className="text-red-500" />}
          amountColor={monthlyIncomeValue >= 0 ? "text-green-500" : "text-red-500"}
        />
        <StatCard
          title="Despesas do Mês"
          amount={formatCurrency(monthlyExpensesValue)}
          icon={<ArrowDown className="text-red-500" />}
          amountColor="text-red-500"
        />
        <StatCard
          title="Total a Receber"
          amount={formatCurrency(data?.totalReceivablesAmount ?? 0)}
          icon={<Wallet className="text-blue-500" />}
          amountColor="text-blue-500"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        <div className="lg:col-span-3">
          <OverviewChart data={data?.chartData ?? []} />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions transactions={data?.recentTransactions ?? []} />
        </div>
      </section>
    </div>
  );
};