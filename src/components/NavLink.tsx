import { cn } from "@/lib/utils";
import React from "react";
import { Link } from "react-router-dom";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

export const NavLink = ({ href, icon, children, active = false }: NavLinkProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {children}
    </Link>
  );
};