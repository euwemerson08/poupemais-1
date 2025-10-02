import React from "react";
import { Transaction } from "@/types/transaction";
import { TransactionItem } from "./TransactionItem";

interface MonthlyTransactionsGroupProps {
  monthYear: string;
  transactions: Transaction[];
}

export const MonthlyTransactionsGroup = ({ monthYear, transactions }: MonthlyTransactionsGroupProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-foreground capitalize">{monthYear}</h2>
      <div className="bg-card rounded-lg shadow-sm divide-y divide-border">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
};