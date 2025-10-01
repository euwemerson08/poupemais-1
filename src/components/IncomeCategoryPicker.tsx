import { Landmark, Briefcase, Gift, MoreHorizontal } from "lucide-react";
import { Category } from "@/types/category";
import { cn } from "@/lib/utils";

export const incomeCategories: Category[] = [
  { id: 'Salário', name: 'Salário', icon: Landmark },
  { id: 'Freelance', name: 'Freelance', icon: Briefcase },
  { id: 'Presente', name: 'Presente', icon: Gift },
  { id: 'Outros', name: 'Outros', icon: MoreHorizontal },
];

interface IncomeCategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const IncomeCategoryPicker = ({ value, onChange }: IncomeCategoryPickerProps) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {incomeCategories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            type="button"
            key={category.id}
            onClick={() => onChange(category.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
              value === category.id
                ? "border-primary bg-primary/10"
                : "border-transparent bg-white/5 hover:bg-white/10"
            )}
          >
            <Icon className={cn("h-6 w-6", value === category.id ? "text-primary" : "text-gray-400")} />
            <span className="text-xs text-center">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};