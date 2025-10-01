import {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal, LucideIcon
} from "lucide-react";
import { Transaction } from "@/types/transaction";
import { format, parseISO } from "date-fns";

const iconMap: { [key: string]: LucideIcon } = {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal
};

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(value));
  return value > 0 ? `+ ${formatted}` : `- ${formatted}`;
};

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const Icon = transaction.category_icon ? iconMap[transaction.category_icon] : MoreHorizontal;
  const isIncome = transaction.amount > 0;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium">{transaction.description}</p>
          <p className="text-sm text-gray-400">
            {transaction.accounts?.name} · {format(parseISO(transaction.date), "dd/MM/yyyy")}
          </p>
        </div>
      </div>
      <p className={`font-semibold ${isIncome ? "text-green-500" : "text-red-500"}`}>
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
};