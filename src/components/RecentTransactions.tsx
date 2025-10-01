import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Landmark, Car, LucideIcon, MoreHorizontal } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import { categories } from "./CategoryPicker";
import { cn } from "@/lib/utils";

const categoryIconMap: { [key: string]: LucideIcon } = {
  'Alimentação': UtensilsCrossed, 'Moradia': Car, 'Transporte': Car, 'Lazer': Film,
  'Saúde': HeartPulse, 'Compras': ShoppingCart, 'Educação': GraduationCap, 'Viagens': Plane,
  'Presentes': Gift, 'Serviços': Wrench, 'Pagamentos': Landmark, 'Outros': MoreHorizontal,
  'Recebimentos': Landmark, // Adicionado para receitas
};

const categoryStyles: { [key: string]: { bg: string; text: string } } = {
  'Alimentação': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  'Moradia': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  'Transporte': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'Lazer': { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  'Saúde': { bg: 'bg-red-500/20', text: 'text-red-400' },
  'Compras': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'Educação': { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  'Viagens': { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  'Presentes': { bg: 'bg-green-500/20', text: 'text-green-400' },
  'Serviços': { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  'Pagamentos': { bg: 'bg-lime-500/20', text: 'text-lime-400' },
  'Recebimentos': { bg: 'bg-green-500/20', text: 'text-green-400' }, // Estilo para receitas
  'Outros': { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(value));
  };

  return (
    <Card className="bg-card border-none h-full">
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center">Nenhuma transação recente.</p>
          ) : (
            transactions.map((transaction) => {
              const categoryName = transaction.category_name || (transaction.amount > 0 ? 'Recebimentos' : 'Outros');
              const Icon = categoryIconMap[categoryName] || MoreHorizontal;
              const styles = categoryStyles[categoryName] || categoryStyles['Outros'];
              const isIncome = transaction.amount > 0;

              return (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", styles.bg)}>
                      <Icon className={cn("h-4 w-4", styles.text)} />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-400">{format(parseISO(transaction.date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${isIncome ? "text-green-500" : "text-red-500"}`}>
                    {isIncome ? "+ " : "- "}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};