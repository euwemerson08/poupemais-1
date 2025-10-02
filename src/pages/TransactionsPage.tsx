import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TransactionItem } from '@/components/TransactionItem';
import { Transaction } from '@/types/transaction';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const fetchTransactions = async (month: number, year: number): Promise<Transaction[]> => {
  const { data, error } = await supabase.rpc('get_transactions_by_month_with_installments', {
    p_month: month,
    p_year: year,
  });

  if (error) throw new Error(error.message);
  return data as Transaction[];
};

export default function TransactionsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth() + 1;
  const selectedYear = currentDate.getFullYear();

  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['transactions', selectedMonth, selectedYear],
    queryFn: () => fetchTransactions(selectedMonth, selectedYear),
  });

  const handlePreviousMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1));
  };

  if (isLoading) return <div className="p-4 text-center">Carregando transações...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Erro ao carregar transações: {error.message}</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-5 w-5 text-primary" />
          </Button>
          <CardTitle className="text-xl font-semibold text-primary">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-5 w-5 text-primary" />
          </Button>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <TransactionItem transaction={transaction} />
                  <Separator className="bg-border" />
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Nenhuma transação encontrada para este mês.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}