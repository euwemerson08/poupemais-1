import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";

interface AccountCardProps {
  icon: React.ReactNode;
  title: string;
  type: string;
  balanceLabel: string;
  balance: string;
  limit?: string;
  className?: string;
}

export const AccountCard = ({
  icon,
  title,
  type,
  balanceLabel,
  balance,
  limit,
  className,
}: AccountCardProps) => {
  return (
    <Card className={cn("border-none text-white p-6 flex flex-col justify-between h-56 rounded-2xl", className)}>
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {icon}
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-gray-300">{type}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-sm text-gray-300">{balanceLabel}</p>
        <p className="text-3xl font-bold">{balance}</p>
        {limit && <p className="text-sm text-gray-400 mt-1">{limit}</p>}
      </div>
    </Card>
  );
};