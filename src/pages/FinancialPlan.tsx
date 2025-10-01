import { supabase } from "@/integrations/supabase/client";
import type { FinancialPlan } from "@/types/financialPlan";
import { AddFinancialPlanDialog } from "@/components/AddFinancialPlanDialog";
import { FinancialPlanCard } from "@/components/FinancialPlanCard";
import { Loader2, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; // Adicionado: Importação do useQuery

const getFinancialPlans = async (): Promise<FinancialPlan[]> => {
  const { data, error } = await supabase
    .from("financial_plans")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as FinancialPlan[];
};

const FinancialPlan = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["financial_plans"],
    queryFn: getFinancialPlans,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Plano Financeiro</h1>
          <p className="text-gray-400 mt-1">
            Crie e acompanhe seus objetivos e orçamentos.
          </p>
        </div>
        <AddFinancialPlanDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : plans && plans.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <FinancialPlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <Target className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhum plano financeiro encontrado</h3>
          <p className="text-gray-400">Comece criando seu primeiro objetivo.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialPlan;