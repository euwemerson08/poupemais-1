import { Dashboard } from "@/components/Dashboard";
import { Sidebar } from "@/components/Sidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-8 overflow-auto">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;