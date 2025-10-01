import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  amount: string;
  icon?: React.ReactNode;
  amountColor?: string;
}

export const StatCard = ({ title, amount, icon, amountColor }: StatCardProps) => {
  return (
    <Card className="bg-card border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold flex items-center gap-2", amountColor)}>
          {icon}
          {amount}
        </div>
      </CardContent>
    </Card>
  );
};