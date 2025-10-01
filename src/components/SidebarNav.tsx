import {
  LayoutGrid,
  Wallet,
  ShoppingCart,
  CalendarDays,
  ReceiptText,
  PiggyBank,
  HandCoins,
  ArrowRightLeft,
  List,
  BarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "./NavLink";

export const SidebarNav = () => {
  return (
    <>
      <nav className="flex flex-col gap-2 flex-1 mt-4">
        <NavLink href="#" icon={<LayoutGrid size={20} />} active>
          Dashboard
        </NavLink>
        <NavLink href="#" icon={<Wallet size={20} />}>
          Contas
        </NavLink>
        <NavLink href="#" icon={<ShoppingCart size={20} />}>
          Compras
        </NavLink>
        <NavLink href="#" icon={<CalendarDays size={20} />}>
          Compras Parceladas
        </NavLink>
        <NavLink href="#" icon={<ReceiptText size={20} />}>
          Despesas Fixas
        </NavLink>
        <NavLink href="#" icon={<PiggyBank size={20} />}>
          Plano Financeiro
        </NavLink>
        <NavLink href="#" icon={<HandCoins size={20} />}>
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
    </>
  );
};