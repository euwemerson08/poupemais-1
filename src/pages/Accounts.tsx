import { Wallet, Landmark, CreditCard } from "lucide-react";
import { AccountCard } from "@/components/AccountCard";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { Account, AccountIcon } from "@/types/account";

const accountsData: Account[] = [
  { id: '1', name: 'Carteira', type: 'wallet', balance: 150.75, color: '#22c55e', icon: 'wallet' },
  { id: '2', name: 'Banco Principal', type: 'checking', balance: 3500.00, color: '#3b82f6', icon: 'landmark' },
  { id: '3', name: 'Cartão de Crédito', type: 'credit_card', balance: 850.20, color: '#ef4444', icon: 'credit_card', limit: 5000.00 },
];

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
  };
  return colorMap[color] || colorMap['#22c55e'];
};

const Accounts = () => {
  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contas</h1>
          <p className="text-gray-400 mt-1">
            Gerencie suas contas, carteiras e cartões de crédito.
          </p>
        </div>
        <AddAccountDialog />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {accountsData.map((account) => {
          const styles = getCardStyles(account.color);
          return (
            <AccountCard
              key={account.id}
              account={account}
              icon={
                <div className={`${styles.bg} p-3 rounded-full`}>
                  {getIconComponent(account.icon, styles.text)}
                </div>
              }
              className={`bg-gradient-to-br ${styles.gradient}`}
            />
          );
        })}
      </section>
    </div>
  );
};

export default Accounts;