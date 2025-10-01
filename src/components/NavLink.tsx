import { cn } from "@/lib/utils";
import React from "react";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

export const NavLink = ({ href, icon, children, active = false }: NavLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {children}
    </a>
  );
};