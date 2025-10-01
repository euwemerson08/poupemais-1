import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Account } from "@/types/account";
import { IncomeCategoryPicker, incomeCategories } from "./IncomeCategoryPicker";

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

const incomeSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.date({ required_error: "Data é obrigatória" }),
  account_id: z.string().min(1, "Conta é obrigatória"),
  category_id: z.string().min(1, "Categoria é obrigatória"),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*").neq("type", "credit_card");
  if (error) throw new Error(error.message);
  return data as Account[];
};

const createIncome = async (formData: IncomeFormData) => {
  const selectedCategory = incomeCategories.find(c => c.id === formData.category_id);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(formData.amount.replace("R$ ", "").replace(".", "").replace(",", "."));

  const { error } = await supabase.rpc('create_income', {
    p_description: formData.description,
    p_amount: amountAsNumber,
    p_date: format(formData.date, "yyyy-MM-dd"),
    p_account_id: formData.account_id,
    p_category_name: selectedCategory.name,
    p_category_icon: selectedCategory.icon.displayName,
  });

  if (error) throw new Error(error.message);
};

export const AddIncomeDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts", "no-credit"], queryFn: getAccounts });

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { date: new Date() },
  });

  const mutation = useMutation({
    mutationFn: createIncome,
    onSuccess: () => {
      showSuccess("Receita adicionada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
      reset({ date: new Date(), description: "", amount: "", account_id: "", category_id: "" });
    },
    onError: (err) => {
      showError(`Erro ao adicionar receita: ${err.message}`);
    },
  });

  const onSubmit = (data: IncomeFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} placeholder="Ex: Salário" className="bg-background" />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="account_id">Conta</Label>
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
            <Label>Categoria</Label>
            <Controller name="category_id" control={control} render={({ field }) => (
              <IncomeCategoryPicker value={field.value} onChange={field.onChange} />
            )} />
            {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};