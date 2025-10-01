import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Wallet, Landmark, CreditCard } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Account, accountSchema, AccountFormData } from "@/types/account";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const colors = [
  "#3b82f6", "#22c55e", "#a855f7", "#ef4444",
  "#14b8a6", "#f59e0b", "#ec4899", "#f97316",
];

const updateAccount = async ({ id, ...account }: AccountFormData) => {
  if (!id) throw new Error("ID da conta é necessário para atualizar.");
  const { error } = await supabase.from("accounts").update(account).eq("id", id);
  if (error) throw new Error(error.message);
};

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
}

export const EditAccountDialog = ({ open, onOpenChange, account }: EditAccountDialogProps) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  useEffect(() => {
    if (account) {
      reset(account);
    }
  }, [account, reset]);

  const selectedColor = watch("color");

  const mutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      showSuccess("Conta atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
    },
    onError: () => {
      showError("Erro ao atualizar conta.");
    },
  });

  const onSubmit = (data: AccountFormData) => {
    mutation.mutate({ ...data, id: account.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" {...register("name")} className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Conta</Label>
            <Controller name="type" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Carteira</SelectItem>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="balance">Saldo</Label>
            <Input id="balance" {...register("balance")} className="bg-background" />
            {errors.balance && <p className="text-red-500 text-sm">{errors.balance.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Ícone</Label>
            <Controller name="icon" control={control} render={({ field }) => (
              <ToggleGroup type="single" variant="outline" value={field.value} onValueChange={field.onChange} className="justify-start gap-2">
                <ToggleGroupItem value="wallet"><Wallet className="h-5 w-5" /></ToggleGroupItem>
                <ToggleGroupItem value="landmark"><Landmark className="h-5 w-5" /></ToggleGroupItem>
                <ToggleGroupItem value="credit_card"><CreditCard className="h-5 w-5" /></ToggleGroupItem>
              </ToggleGroup>
            )} />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};