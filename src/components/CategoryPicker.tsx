import {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal
} from "lucide-react";
import { Category } from "@/types/category";
import { cn } from "@/lib/utils";

export const categories: Category[] = [
  { id: 'Alimentação', name: 'Alimentação', icon: UtensilsCrossed },
  { id: 'Moradia', name: 'Moradia', icon: Home },
  { id: 'Transporte', name: 'Transporte', icon: Car },
  { id: 'Lazer', name: 'Lazer', icon: Film },
  { id: 'Saúde', name: 'Saúde', icon: HeartPulse },
  { id: 'Compras', name: 'Compras', icon: ShoppingCart },
  { id: 'Educação', name: 'Educação', icon: GraduationCap },
  { id: 'Viagens', name: 'Viagens', icon: Plane },
  { id: 'Presentes', name: 'Presentes', icon: Gift },
  { id: 'Serviços', name: 'Serviços', icon: Wrench },
  { id: 'Pagamentos', name: 'Pagamentos', icon: Landmark },
  { id: 'Outros', name: 'Outros', icon: MoreHorizontal },
];

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryPicker = ({ value, onChange }: CategoryPickerProps) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((category) => {
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