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
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, AccountFormData } from "@/types/account";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const colors = [
  "#3b82f6", "#22c55e", "#a855f7", "#ef4444",
  "#14b8a6", "#f59e0b", "#ec4899", "#f97316",
];

const createCreditCard = async (account: Omit<AccountFormData, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("accounts").insert({ ...account, user_id: user.id });
  if (error) throw new Error(error.message);
};

export const AddCreditCardDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: "credit_card",
      icon: "credit_card",
      color: colors[0],
    },
  });

  const selectedColor = watch("color");

  const mutation = useMutation({
    mutationFn: createCreditCard,
    onSuccess: () => {
      showSuccess("Cartão de crédito adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["accounts", "credit_card"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
    onError: () => {
      showError("Erro ao adicionar cartão de crédito.");
    },
  });

  const onSubmit = (data: AccountFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E63980] hover:bg-[#d63374] text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cartão de Crédito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cartão</Label>
            <Input id="name" {...register("name")} placeholder="Ex: Cartão Nubank" className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="balance">Fatura Atual</Label>
            <Input id="balance" {...register("balance")} placeholder="R$ 0,00" className="bg-background" />
            {errors.balance && <p className="text-red-500 text-sm">{errors.balance.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="limit">Limite do Cartão</Label>
            <Input id="limit" {...register("limit")} placeholder="R$ 1000,00" className="bg-background" />
            {errors.limit && <p className="text-red-500 text-sm">{errors.limit.message}</p>}
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