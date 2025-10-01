"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { categories } from "./CategoryPicker";
import React from "react";

// Cores para o gráfico de pizza, baseadas nas categorias existentes
const PIE_COLORS = categories.map(cat => cat.color);

const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Transaction[];
};

interface ExpenseData {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card p-2 border border-border rounded-md text-foreground">
        <p className="font-bold">{data.name}</p>
        <p>{`${data.percentage.toFixed(1)}% (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.value)})`}</p>
      </div>
    );
  }
  return null;
};

export const ExpenseDistributionChart = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const chartData = React.useMemo(() => {
    if (!transactions) return [];

    const expenses = transactions.filter(tx => tx.amount < 0);
    const totalExpenses = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    if (totalExpenses === 0) return [];

    const categoryMap = new Map<string, number>();
    expenses.forEach(tx => {
      const categoryName = tx.category_name || "Outros";
      const currentAmount = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentAmount + Math.abs(tx.amount));
    });

    const data: ExpenseData[] = Array.from(categoryMap.entries()).map(([name, value], index) => {
      const category = categories.find(cat => cat.name === name);
      return {
        name,
        value,
        color: category ? category.color : PIE_COLORS[index % PIE_COLORS.length],
        percentage: (value / totalExpenses) * 100,
      };
    });

    return data.sort((a, b) => b.value - a.value); // Ordenar por valor para melhor visualização
  }, [transactions]);

  if (isLoading) {
    return (
      <Card className="bg-card border-none h-full flex items-center justify-center">
        <CardContent>
          <p className="text-gray-400">Carregando dados do gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-none h-full flex items-center justify-center">
        <CardContent>
          <p className="text-gray-400">Nenhuma despesa registrada para exibir o gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-none h-full">
      <CardHeader>
        <CardTitle>Distribuição de Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};