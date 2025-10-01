import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Account } from "@/types/account";
import { Transaction } from "@/types/transaction";
import { CategoryPicker, categories } from "./CategoryPicker";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

const editTransactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.date({ required_error: "Data é obrigatória" }),
  account_id: z.string().min(1, "Conta é obrigatória"),
  category_name: z.string().min(1, "Categoria é obrigatória"),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*").neq('type', 'credit_card');
  if (error) throw new Error(error.message);
  return data as Account[];
};

const updateTransaction = async ({ id, formData }: { id: string, formData: EditTransactionFormData }) => {
  const selectedCategory = categories.find(c => c.name === formData.category_name);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(formData.amount.replace("R$ ", "").replace(".", "").replace(",", "."));
  const amountToUpdate = amountAsNumber > 0 ? amountAsNumber : -amountAsNumber;

  const { error } = await supabase.rpc('update_transaction', {
    p_transaction_id: id,
    p_description: formData.description,
    p_amount: -amountToUpdate, // Expenses are negative
    p_date: format(formData.date, "yyyy-MM-dd"),
    p_account_id: formData.account_id,
    p_category_name: selectedCategory.name,
    p_category_icon: selectedCategory.icon.displayName,
  });

  if (error) throw new Error(error.message);
};

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
}

export const EditTransactionDialog = ({ open, onOpenChange, transaction }: EditTransactionDialogProps) => {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
  });

  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description,
        amount: `R$ ${Math.abs(transaction.amount).toFixed(2).replace('.', ',')}`,
        date: parseISO(transaction.date),
        account_id: transaction.accounts?.id,
        category_name: transaction.category_name,
      });
    }
  }, [transaction, reset]);

  const mutation = useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      showSuccess("Transação atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao atualizar transação: ${err.message}`);
    },
  });

  const onSubmit = (data: EditTransactionFormData) => {
    mutation.mutate({ id: transaction.id, formData: data });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
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
              <Label>Data</Label>
              <Controller name="date" control={control} render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start font-normal bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
              )} />
              {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account_id">Conta</Label>
            <Controller name="account_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.account_id && <p className="text-red-500 text-sm">{errors.account_id.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Controller name="category_name" control={control} render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )} />
            {errors.category_name && <p className="text-red-500 text-sm">{errors.category_name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};