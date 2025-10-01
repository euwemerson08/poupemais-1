"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OverviewChartProps {
  data: { name: string; Receitas: number; Despesas: number; }[];
}

export const OverviewChart = ({ data }: OverviewChartProps) => {
  return (
    <Card className="bg-card border-none h-full">
      <CardHeader>
        <CardTitle>Visão Geral (Últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161B22",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Bar dataKey="Despesas" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Receitas" fill="#22c55e" name="Receitas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}