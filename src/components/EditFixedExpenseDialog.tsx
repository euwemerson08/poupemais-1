import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Account } from "@/types/account";
import { FixedExpense, FixedExpenseFormData, fixedExpenseSchema } from "@/types/fixedExpense";
import { categories } from "./CategoryPicker";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*");
  if (error) throw new Error(error.message);
  return data as Account[];
};

const updateFixedExpense = async ({ id, ...formData }: FixedExpenseFormData) => {
  if (!id) throw new Error("ID da despesa é necessário.");

  const selectedCategory = categories.find(c => c.name === formData.category_name);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(String(formData.amount).replace("R$ ", "").replace(".", "").replace(",", "."));

  const { error } = await supabase.from("fixed_expenses").update({
    description: formData.description,
    amount: amountAsNumber,
    due_day: formData.due_day,
    account_id: formData.account_id,
    category_name: selectedCategory.name,
    category_icon: selectedCategory.icon.displayName || 'MoreHorizontal',
  }).eq('id', id);

  if (error) throw new Error(error.message);
};

interface EditFixedExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: FixedExpense;
}

export const EditFixedExpenseDialog = ({ open, onOpenChange, expense }: EditFixedExpenseDialogProps) => {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<FixedExpenseFormData>({
    resolver: zodResolver(fixedExpenseSchema),
  });

  useEffect(() => {
    if (expense) {
      reset({
        ...expense,
        amount: String(expense.amount.toFixed(2)).replace('.', ','),
      });
    }
  }, [expense, reset]);

  const mutation = useMutation({
    mutationFn: updateFixedExpense,
    onSuccess: () => {
      showSuccess("Despesa fixa atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fixed_expenses"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao atualizar despesa: ${err.message}`);
    },
  });

  const onSubmit = (data: FixedExpenseFormData) => {
    mutation.mutate({ ...data, id: expense.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Despesa Fixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} className="bg-background" />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" {...register("amount")} className="bg-background" />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_day">Dia do Vencimento</Label>
              <Input id="due_day" type="number" {...register("due_day")} className="bg-background" />
              {errors.due_day && <p className="text-red-500 text-sm">{errors.due_day.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account_id">Conta de Pagamento</Label>
            <Controller name="account_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.account_id && <p className="text-red-500 text-sm">{errors.account_id.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category_name">Categoria</Label>
            <Controller name="category_name" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.category_name && <p className="text-red-500 text-sm">{errors.category_name.message}</p>}
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