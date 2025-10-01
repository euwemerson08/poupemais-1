import { Wallet, Landmark, CreditCard } from "lucide-react";
import { AccountCard } from "@/components/AccountCard";
import { AddAccountDialog } from "@/components/AddAccountDialog";

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
        <AccountCard
          title="Carteira"
          type="Wallet"
          balanceLabel="Saldo"
          balance="R$ 150,75"
          icon={
            <div className="bg-green-500/20 p-3 rounded-full">
              <Wallet className="h-6 w-6 text-green-400" />
            </div>
          }
          className="bg-gradient-to-br from-green-900/70 to-green-900/40"
        />
        <AccountCard
          title="Banco Principal"
          type="Checking"
          balanceLabel="Saldo"
          balance="R$ 3.500,00"
          icon={
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Landmark className="h-6 w-6 text-blue-400" />
            </div>
          }
          className="bg-gradient-to-br from-blue-900/70 to-blue-900/40"
        />
        <AccountCard
          title="Cartão de Crédito"
          type="Credit Card"
          balanceLabel="Fatura Atual"
          balance="R$ 850,20"
          limit="Limite: R$ 5.000,00"
          icon={
            <div className="bg-red-500/20 p-3 rounded-full">
              <CreditCard className="h-6 w-6 text-red-400" />
            </div>
          }
          className="bg-gradient-to-br from-red-900/70 to-red-900/40"
        />
      </section>
    </div>
  );
};

export default Accounts;