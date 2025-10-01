import {
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  CreditCard,
  Landmark,
  Target,
  CalendarPlus,
  ArrowRightLeft,
  List,
  BarChart,
  Settings,
  LogOut,
  PiggyBank,
} from "lucide-react";
import { NavLink } from "./NavLink";
import { useLocation } from "react-router-dom";

export const SidebarContent = () => {
  const { pathname } = useLocation();

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
        <NavLink href="#" icon={<ShoppingCart size={20} />}>
          Compras
        </NavLink>
        <NavLink href="#" icon={<CreditCard size={20} />}>
          Compras Parceladas
        </NavLink>
        <NavLink href="#" icon={<Landmark size={20} />}>
          Despesas Fixas
        </NavLink>
        <NavLink href="#" icon={<Target size={20} />}>
          Plano Financeiro
        </NavLink>
        <NavLink href="#" icon={<CalendarPlus size={20} />}>
          Contas a Receber
        </NavLink>
        <NavLink href="#" icon={<ArrowRightLeft size={20} />}>
          Transferências
        </NavLink>
        <NavLink href="#" icon={<List size={20} />}>
          Listas de Compras
        </NavLink>
        <NavLink href="#" icon={<BarChart size={20} />}>
          Dados Financeiros
        </NavLink>
        <NavLink href="#" icon={<Settings size={20} />}>
          Configurações
        </NavLink>
      </nav>
      <div>
        <NavLink href="#" icon={<LogOut size={20} />}>
          Logout
        </NavLink>
      </div>
    </div>
  );
};