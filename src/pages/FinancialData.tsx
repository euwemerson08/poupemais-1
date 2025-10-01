import { ExpenseDistributionChart } from "@/components/ExpenseDistributionChart";

const FinancialData = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Dados Financeiros</h1>
        <p className="text-gray-400 mt-1">
          Análises aprofundadas sobre suas finanças.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6">
        <ExpenseDistributionChart />
        {/* Futuros gráficos podem ser adicionados aqui */}
      </section>
    </div>
  );
};

export default FinancialData;