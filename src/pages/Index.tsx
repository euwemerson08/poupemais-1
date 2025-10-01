import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

export default Index;