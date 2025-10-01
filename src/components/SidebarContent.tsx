import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Landmark,
  Target,
  CalendarPlus,
  ArrowRightLeft,
  List,
  BarChart, // Importar BarChart para o ícone
  Settings,
  LogOut,
  PiggyBank,
  Receipt,
} from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const SidebarContent = () => {
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-10">
        <PiggyBank className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Financely</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        <NavLink href="/" icon={<LayoutDashboard size={20} />} active={pathname === "/"}>
          Dashboard
        </NavLink>
        <NavLink href="/accounts" icon={<Wallet size={20} />} active={pathname === "/accounts"}>
          Contas
        </NavLink>
        <NavLink href="/transactions" icon={<ArrowRightLeft size={20} />} active={pathname === "/transactions"}>
          Transações
        </NavLink>
        <NavLink href="/credit-cards" icon={<CreditCard size={20} />} active={pathname === "/credit-cards"}>
          Cartões de Crédito
        </NavLink>
        <NavLink href="/invoices" icon={<Receipt size={20} />} active={pathname === "/invoices"}>
          Faturas
        </NavLink>
        <NavLink href="/fixed-expenses" icon={<Landmark size={20} />} active={pathname === "/fixed-expenses"}>
          Despesas Fixas
        </NavLink>
        <NavLink href="/financial-plan" icon={<Target size={20} />} active={pathname === "/financial-plan"}>
          Plano Financeiro
        </NavLink>
        <NavLink href="/receivables" icon={<CalendarPlus size={20} />} active={pathname === "/receivables"}>
          Contas a Receber
        </NavLink>
        <NavLink href="#" icon={<List size={20} />}>
          Listas de Compras
        </NavLink>
        <NavLink href="/financial-data" icon={<BarChart size={20} />} active={pathname === "/financial-data"}> {/* Novo link */}
          Dados Financeiros
        </NavLink>
        <NavLink href="#" icon={<Settings size={20} />}>
          Configurações
        </NavLink>
      </nav>
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};