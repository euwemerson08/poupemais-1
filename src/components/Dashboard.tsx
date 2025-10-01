import { useState } from "react";
import { StatCard } from "./StatCard";
import { OverviewChart } from "./OverviewChart";
import { RecentTransactions } from "./RecentTransactions";
import { ArrowUp, ArrowDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Dashboard = () => {
  const [iconSize, setIconSize] = useState("h-16 w-16");

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4 pb-8">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className={iconSize} />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-4 bg-card border-r-0">
                <SidebarNav />
              </SheetContent>
            </Sheet>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Bem-vindo(a) de volta! Aqui está um resumo das suas finanças.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="icon-size-select" className="text-sm text-gray-400">
            Tamanho do Ícone:
          </Label>
          <Select onValueChange={setIconSize} defaultValue={iconSize}>
            <SelectTrigger id="icon-size-select" className="w-[150px]">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h-8 w-8">Pequeno</SelectItem>
              <SelectItem value="h-10 w-10">Médio</SelectItem>
              <SelectItem value="h-12 w-12">Grande</SelectItem>
              <SelectItem value="h-16 w-16">Extra Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Saldo Total"
          amount="R$ 3.650,75"
        />
        <StatCard
          title="Receitas do Mês"
          amount="R$ 5.230,50"
          icon={<ArrowUp className="text-green-500" />}
          amountColor="text-green-500"
        />
        <StatCard
          title="Despesas do Mês"
          amount="R$ 3.150,80"
          icon={<ArrowDown className="text-red-500" />}
          amountColor="text-red-500"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        <div className="lg:col-span-3">
          <OverviewChart />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
      </section>
    </div>
  );
};