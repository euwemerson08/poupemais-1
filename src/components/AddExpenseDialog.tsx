import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Account } from "@/types/account";
import { CategoryPicker, categories } from "./CategoryPicker";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";

const expenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.date({ required_error: "Data é obrigatória" }),
  account_id: z.string().min(1, "Conta é obrigatória"),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  total_installments: z.number().int().min(1).optional().default(1),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*");
  if (error) throw new Error(error.message);
  return data as Account[];
};

const createExpense = async (formData: ExpenseFormData) => {
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(formData.amount.replace("R$ ", "").replace(".", "").replace(",", "."));

  const { error } = await supabase.rpc('create_expense', {
    p_description: formData.description,
    p_amount: amountAsNumber,
    p_date: format(formData.date, "yyyy-MM-dd"),
    p_account_id: formData.account_id,
    p_category_name: selectedCategory.name,
    p_category_icon: selectedCategory.icon.displayName,
    p_total_installments: formData.total_installments,
  });

  if (error) throw new Error(error.message);
};

export const AddExpenseDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });

  const { control, register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: new Date(), total_installments: 1 },
  });

  const selectedAccountId = watch("account_id");
  const selectedAccount = accounts?.find(acc => acc.id === selectedAccountId);

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      showSuccess("Despesa adicionada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
      reset({ date: new Date(), total_installments: 1, description: "", amount: "", account_id: "", category_id: "" });
    },
    onError: (err) => {
      showError(`Erro ao adicionar despesa: ${err.message}`);
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <PlusCircle className="mr-2 h-4 w-4" /> Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} placeholder="Ex: Jantar com amigos" className="bg-background" />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Ajustado para responsividade */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" {...register("amount")} placeholder="R$ 0,00" className="bg-background" />
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
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                </Popover>
              )} />
              {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account_id">Conta / Cartão</Label>
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
          {selectedAccount?.type === 'credit_card' && (
            <div className="grid gap-2">
              <Label htmlFor="total_installments">Parcelas</Label>
              <Input id="total_installments" type="number" {...register("total_installments", { valueAsNumber: true })} min={1} className="bg-background" />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Controller name="category_id" control={control} render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )} />
            {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};