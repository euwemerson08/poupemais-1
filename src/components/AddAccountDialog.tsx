import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Wallet, Landmark, CreditCard, PlusCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const colors = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#ef4444", // red
  "#14b8a6", // cyan
  "#f59e0b", // yellow
  "#ec4899", // pink
  "#f97316", // orange
];

export const AddAccountDialog = () => {
  const [selectedIcon, setSelectedIcon] = useState("wallet");
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#E63980] hover:bg-[#d63374] text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Conta</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" placeholder="Ex: Carteira, Banco Principal" className="bg-background" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Conta</Label>
            <Select defaultValue="wallet">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wallet">Carteira</SelectItem>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="balance">Saldo Inicial</Label>
            <Input id="balance" placeholder="R$ 0,00" className="bg-background" />
          </div>
          <div className="grid gap-2">
            <Label>Ícone</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={selectedIcon}
              onValueChange={(value) => value && setSelectedIcon(value)}
              className="justify-start gap-2"
            >
              <ToggleGroupItem value="wallet" aria-label="Wallet" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary">
                <Wallet className="h-5 w-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="landmark" aria-label="Landmark" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary">
                <Landmark className="h-5 w-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="credit_card" aria-label="Credit Card" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary">
                <CreditCard className="h-5 w-5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    selectedColor === color && "ring-2 ring-offset-2 ring-offset-card ring-primary"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};