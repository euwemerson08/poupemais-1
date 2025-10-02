import { MobileSidebar } from "./MobileSidebar";
import { Notifications } from "./Notifications"; // Importar o componente de notificações

export const Header = () => {
  return (
    <header className="lg:hidden flex items-center h-16 px-4 border-b bg-background sticky top-0 z-10">
      <MobileSidebar />
      <div className="ml-auto"> {/* Adicionado div com ml-auto para empurrar para a direita */}
        <Notifications />
      </div>
    </header>
  );
};