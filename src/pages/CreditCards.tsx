import { Wallet, Landmark, CreditCard, Loader2 } from "lucide-react";
import { AccountCard } from "@/components/AccountCard";
import { AddCreditCardDialog } from "@/components/AddCreditCardDialog";
import { Account, AccountIcon } from "@/types/account";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const getCreditCards = async (): Promise<Account[]> => {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("type", "credit_card");

  if (error) {
    showError("Erro ao buscar cartões de crédito.");
    throw new Error(error.message);
  }
  return data as Account[];
};

const getIconComponent = (icon: AccountIcon, colorClass: string) => {
  const icons = {
    wallet: <Wallet className={`h-6 w-6 ${colorClass}`} />,
    landmark: <Landmark className={`h-6 w-6 ${colorClass}`} />,
    credit_card: <CreditCard className={`h-6 w-6 ${colorClass}`} />,
  };
  return icons[icon];
};

const getCardStyles = (color: string) => {
  const colorMap: { [key: string]: { bg: string; text: string; gradient: string } } = {
    '#22c55e': { bg: 'bg-green-500/20', text: 'text-green-400', gradient: 'from-green-900/70 to-green-900/40' },
    '#3b82f6': { bg: 'bg-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-900/70 to-blue-900/40' },
    '#ef4444': { bg: 'bg-red-500/20', text: 'text-red-400', gradient: 'from-red-900/70 to-red-900/40' },
    '#a855f7': { bg: 'bg-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-900/70 to-purple-900/40' },
    '#14b8a6': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', gradient: 'from-cyan-900/70 to-cyan-900/40' },
    '#f59e0b': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', gradient: 'from-yellow-900/70 to-yellow-900/40' },
    '#ec4899': { bg: 'bg-pink-500/20', text: 'text-pink-400', gradient: 'from-pink-900/70 to-pink-900/40' },
    '#f97316': { bg: 'bg-orange-500/20', text: 'text-orange-400', gradient: 'from-orange-900/70 to-orange-900/40' },
  };
  return colorMap[color] || colorMap['#a855f7'];
};

const CreditCards = () => {
  const { data: creditCards, isLoading } = useQuery({
    queryKey: ["accounts", "credit_card"],
    queryFn: getCreditCards,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cartões de Crédito</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus cartões e acompanhe suas faturas.
          </p>
        </div>
        <AddCreditCardDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {creditCards?.map((card) => {
            const styles = getCardStyles(card.color);
            return (
              <AccountCard
                key={card.id}
                account={card}
                icon={
                  <div className={`${styles.bg} p-3 rounded-full`}>
                    {getIconComponent(card.icon, styles.text)}
                  </div>
                }
                className={`bg-gradient-to-br ${styles.gradient}`}
              />
            );
          })}
        </section>
      )}
    </div>
  );
};

export default CreditCards;