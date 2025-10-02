import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, Wallet, Repeat, PiggyBank, ShoppingCart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MainNav } from "@/components/MainNav";
import { UserNav } from "@/components/UserNav";
import { Overview } from "@/components/Overview";
import { RecentTransactions } from "@/components/RecentTransactions";
import { FinancialSummary } from "@/components/FinancialSummary";
import { FixedExpensesSummary } from "@/components/FixedExpensesSummary";
import { FinancialPlansSummary } from "@/components/FinancialPlansSummary";
import { ReceivablesSummary } from "@/components/ReceivablesSummary";
import { RecurringReceivablesSummary } from "@/components/RecurringReceivablesSummary";
import { ShoppingListsSummary } from "@/components/ShoppingListsSummary";
import { Notifications } from "@/components/Notifications"; // Importar o componente de notificações

const fetchAccounts = async () => {
  const { data, error } = await supabase.from("accounts").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const fetchTransactions = async () => {
  const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const { data: accounts, isLoading: isLoadingAccounts, error: accountsError } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  if (isLoadingAccounts || isLoadingTransactions) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  if (accountsError || transactionsError) {
    return <div className="flex justify-center items-center h-screen text-red-500">Erro ao carregar dados: {accountsError?.message || transactionsError?.message}</div>;
  }

  return (
    <>
      <div className="hidden flex-col md:flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Notifications /> {/* Adicionado o componente de notificações aqui */}
              <UserNav />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              {/* <CalendarDateRangePicker /> */}
              <Button>Baixar</Button>
            </div>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <Home className="mr-2 h-4 w-4" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="accounts">
                <Wallet className="mr-2 h-4 w-4" /> Contas
              </TabsTrigger>
              <TabsTrigger value="fixed-expenses">
                <Repeat className="mr-2 h-4 w-4" /> Despesas Fixas
              </TabsTrigger>
              <TabsTrigger value="financial-plans">
                <PiggyBank className="mr-2 h-4 w-4" /> Planos Financeiros
              </TabsTrigger>
              <TabsTrigger value="receivables">
                <Bell className="mr-2 h-4 w-4" /> Contas a Receber
              </TabsTrigger>
              <TabsTrigger value="recurring-receivables">
                <Repeat className="mr-2 h-4 w-4" /> Recebimentos Recorrentes
              </TabsTrigger>
              <TabsTrigger value="shopping-lists">
                <ShoppingCart className="mr-2 h-4 w-4" /> Listas de Compras
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <FinancialSummary accounts={accounts || []} transactions={transactions || []} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Visão Geral</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview transactions={transactions || []} />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Transações Recentes</CardTitle>
                    <CardDescription>
                      Você fez {transactions?.length || 0} transações este mês.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentTransactions transactions={transactions || []} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="accounts" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts?.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(account.balance)}
                      </div>
                      <p className="text-xs text-muted-foreground">{account.type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="fixed-expenses" className="space-y-4">
              <FixedExpensesSummary />
            </TabsContent>
            <TabsContent value="financial-plans" className="space-y-4">
              <FinancialPlansSummary />
            </TabsContent>
            <TabsContent value="receivables" className="space-y-4">
              <ReceivablesSummary />
            </TabsContent>
            <TabsContent value="recurring-receivables" className="space-y-4">
              <RecurringReceivablesSummary />
            </TabsContent>
            <TabsContent value="shopping-lists" className="space-y-4">
              <ShoppingListsSummary />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}