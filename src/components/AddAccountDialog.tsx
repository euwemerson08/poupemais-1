import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, AccountFormData } from "@/types/account";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const colors = [
  "#3b82f6", "#22c55e", "#a855f7", "#ef4444",
  "#14b8a6", "#f59e0b", "#ec4899", "#f97316",
];

const createAccount = async (account: Omit<AccountFormData, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("accounts").insert({ ...account, user_id: user.id });
  if (error) throw new Error(error.message);
};

export const AddAccountDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: "wallet",
      icon: "wallet",
      color: colors[0],
    },
  });

  const selectedColor = watch("color");
  const accountType = watch("type");
  const balanceLabel = accountType === 'credit_card' ? 'Fatura Inicial' : 'Saldo Inicial';

  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      showSuccess("Conta criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
    onError: () => {
      showError("Erro ao criar conta.");
    },
  });

  const onSubmit = (data: AccountFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E63980] hover:bg-[#d63374] text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" {...register("name")} placeholder="Ex: Carteira" className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Conta</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Carteira</SelectItem>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="balance">{balanceLabel}</Label>
            <Input id="balance" {...register("balance")} placeholder="R$ 0,00" className="bg-background" />
            {errors.balance && <p className="text-red-500 text-sm">{errors.balance.message}</p>}
          </div>
          {accountType === 'credit_card' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="limit">Limite do Cartão</Label>
                <Input id="limit" {...register("limit")} placeholder="R$ 1000,00" className="bg-background" />
                {errors.limit && <p className="text-red-500 text-sm">{errors.limit.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="closing_day">Dia de Fechamento</Label>
                  <Input id="closing_day" type="number" {...register("closing_day")} placeholder="Ex: 20" className="bg-background" />
                  {errors.closing_day && <p className="text-red-500 text-sm">{errors.closing_day.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due_day">Dia de Vencimento</Label>
                  <Input id="due_day" type="number" {...register("due_day")} placeholder="Ex: 28" className="bg-background" />
                  {errors.due_day && <p className="text-red-500 text-sm">{errors.due_day.message}</p>}
                </div>
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label>Ícone</Label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <ToggleGroup type="single" variant="outline" value={field.value} onValueChange={field.onChange} className="justify-start gap-2">
                  <ToggleGroupItem value="wallet" aria-label="Wallet"><Wallet className="h-5 w-5" /></ToggleGroupItem>
                  <ToggleGroupItem value="landmark" aria-label="Landmark"><Landmark className="h-5 w-5" /></ToggleGroupItem>
                  <ToggleGroupItem value="credit_card" aria-label="Credit Card"><CreditCard className="h-5 w-5" /></ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </div>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button type="button" key={color} onClick={() => setValue("color", color)}
                  className={cn("w-8 h-8 rounded-full transition-all", selectedColor === color && "ring-2 ring-offset-2 ring-offset-card ring-primary")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};