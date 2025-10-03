import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useVisibility } from "@/contexts/VisibilityContext"; // Importar useVisibility

interface StatCardProps {
  title: string;
  amount: string;
  icon?: React.ReactNode;
  amountColor?: string;
}

export const StatCard = ({ title, amount, icon, amountColor }: StatCardProps) => {
  const { showAmounts } = useVisibility(); // Usar o hook de visibilidade

  return (
    <Card className="bg-card border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold flex items-center gap-2", amountColor)}>
          {icon}
          {showAmounts ? amount : "R$ ****"} {/* Condicionalmente mostrar valor ou placeholder */}
        </div>
      </CardContent>
    </Card>
  );
};