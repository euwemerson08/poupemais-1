import { StatCard } from "./StatCard";
import { OverviewChart } from "./OverviewChart";
import { RecentTransactions } from "./RecentTransactions";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
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
          amount={formatCurrency(data?.monthlyIncome ?? 0)}
          icon={<ArrowUp className="text-green-500" />}
          amountColor="text-green-500"
        />
        <StatCard
          title="Despesas do Mês"
          amount={formatCurrency(data?.monthlyExpenses ?? 0)}
          icon={<ArrowDown className="text-red-500" />}
          amountColor="text-red-500"
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