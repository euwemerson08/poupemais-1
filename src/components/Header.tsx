import { MobileSidebar } from "./MobileSidebar";

export const Header = () => {
  return (
    <header className="lg:hidden flex items-center h-16 px-4 border-b bg-background sticky top-0 z-10">
      <MobileSidebar />
    </header>
  );
};