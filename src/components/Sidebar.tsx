import { SidebarContent } from "./SidebarContent";

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-card p-6 flex-col hidden lg:flex">
      <SidebarContent />
    </aside>
  );
};