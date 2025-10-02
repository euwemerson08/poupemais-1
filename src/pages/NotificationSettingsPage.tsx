import { NotificationSettingsCard } from "@/components/NotificationSettingsCard";
import { Separator } from "@/components/ui/separator";

export default function NotificationSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
      </div>
      <Separator />
      <div className="max-w-2xl mx-auto">
        <NotificationSettingsCard />
      </div>
    </div>
  );
}