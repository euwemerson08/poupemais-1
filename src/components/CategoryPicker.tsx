import {
  UtensilsCrossed, Home, Car, Film, HeartPulse, ShoppingCart,
  GraduationCap, Plane, Gift, Wrench, Landmark, MoreHorizontal
} from "lucide-react";
import { Category } from "@/types/category";
import { cn } from "@/lib/utils";

export const categories: Category[] = [
  { id: 'Alimentação', name: 'Alimentação', icon: UtensilsCrossed, color: '#E63980' },
  { id: 'Moradia', name: 'Moradia', icon: Home, color: '#3B82F6' },
  { id: 'Transporte', name: 'Transporte', icon: Car, color: '#F59E0B' },
  { id: 'Lazer', name: 'Lazer', icon: Film, color: '#A855F7' },
  { id: 'Saúde', name: 'Saúde', icon: HeartPulse, color: '#EC4899' },
  { id: 'Compras', name: 'Compras', icon: ShoppingCart, color: '#22C55E' },
  { id: 'Educação', name: 'Educação', icon: GraduationCap, color: '#6366F1' },
  { id: 'Viagens', name: 'Viagens', icon: Plane, color: '#14B8A6' },
  { id: 'Presentes', name: 'Presentes', icon: Gift, color: '#F97316' },
  { id: 'Serviços', name: 'Serviços', icon: Wrench, color: '#0EA5E9' },
  { id: 'Pagamentos', name: 'Pagamentos', icon: Landmark, color: '#84CC16' },
  { id: 'Outros', name: 'Outros', icon: MoreHorizontal, color: '#6B7280' },
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
        const isSelected = value === category.id;
        return (
          <button
            type="button"
            key={category.id}
            onClick={() => onChange(category.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all bg-white/5 hover:bg-white/10",
              isSelected ? "border-current" : "border-transparent"
            )}
            style={isSelected ? { color: category.color } : {}}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: isSelected ? category.color : 'transparent'
              }}
            >
              <Icon 
                className="h-5 w-5"
                style={{ color: isSelected ? 'white' : category.color }}
              />
            </div>
            <span className="text-xs text-center text-foreground">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};