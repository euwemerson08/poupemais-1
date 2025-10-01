import { SidebarNav } from "./SidebarNav";

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-card p-4 flex-col hidden lg:flex">
      <SidebarNav />
    </aside>
  );
};