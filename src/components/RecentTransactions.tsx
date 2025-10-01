import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Landmark, Car } from "lucide-react";

const transactions = [
  {
    icon: <UtensilsCrossed className="h-8 w-8 text-white p-1.5 bg-red-500 rounded-full" />,
    name: "Almoço",
    date: "28/07/2024",
    amount: -55.90,
  },
  {
    icon: <Landmark className="h-8 w-8 text-white p-1.5 bg-green-500 rounded-full" />,
    name: "Salário",
    date: "27/07/2024",
    amount: 2500.00,
  },
  {
    icon: <Car className="h-8 w-8 text-white p-1.5 bg-yellow-500 rounded-full" />,
    name: "Uber",
    date: "26/07/2024",
    amount: -120.00,
  },
];

export const RecentTransactions = () => {
  return (
    <Card className="bg-card border-none h-full">
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {transaction.icon}
                <div>
                  <p className="font-medium">{transaction.name}</p>
                  <p className="text-sm text-gray-400">{transaction.date}</p>
                </div>
              </div>
              <p className={`font-semibold ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                {transaction.amount > 0 ? "+ " : "- "}
                R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};