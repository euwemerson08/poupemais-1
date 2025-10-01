import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { receivableSchema, recurrenceIntervals, ReceivableFormInput } from "@/types/receivable"; // Importando ReceivableFormInput
import { CategoryPicker, categories } from "./CategoryPicker";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createReceivable = async (formData: ReceivableFormInput) => { // Usar ReceivableFormInput aqui
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const selectedCategory = categories.find(c => c.id === formData.category_id);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(String(formData.amount).replace("R$ ", "").replace(".", "").replace(",", "."));

  if (formData.is_recurring) {
    // Insert into recurring_receivables table
    const { error } = await supabase.from("recurring_receivables").insert({
      user_id: user.id,
      description: formData.description,
      amount: amountAsNumber,
      start_date: format(formData.due_date, "yyyy-MM-dd"), // due_date becomes start_date for recurring
      recurrence_interval: formData.recurrence_interval,
      end_date: formData.recurrence_end_date ? format(formData.recurrence_end_date, "yyyy-MM-dd") : null,
      category_name: selectedCategory.name,
      category_icon: selectedCategory.icon.displayName,
    });
    if (error) throw new Error(error.message);
  } else {
    // Insert into one-time receivables table
    const { error } = await supabase.from("receivables").insert({
      user_id: user.id,
      description: formData.description,
      amount: amountAsNumber,
      due_date: format(formData.due_date, "yyyy-MM-dd"),
      status: 'pending',
      category_name: selectedCategory.name,
      category_icon: selectedCategory.icon.displayName,
    });
    if (error) throw new Error(error.message);
  }
};

export const AddReceivableDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm<ReceivableFormInput>({ // Usar ReceivableFormInput
    resolver: zodResolver(receivableSchema),
    defaultValues: { due_date: new Date(), is_recurring: false, amount: "" }, // amount: "" é válido para string
  });

  const isRecurring = watch("is_recurring");

  const mutation = useMutation({
    mutationFn: createReceivable,
    onSuccess: () => {
      showSuccess("Conta a receber adicionada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_receivables"] }); // Invalidate recurring query too
      setOpen(false);
      reset({ due_date: new Date(), description: "", amount: "", category_id: "", is_recurring: false, recurrence_interval: undefined, recurrence_end_date: undefined }); // amount: "" é válido
    },
    onError: (err) => {
      showError(`Erro ao adicionar conta a receber: ${err.message}`);
    },
  });

  const onSubmit = (data: ReceivableFormInput) => { // Usar ReceivableFormInput aqui
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E63980] hover:bg-[#d63374] text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Recebimento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Adicionar Conta a Receber</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} placeholder="Ex: Freelance de Design" className="bg-background" />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" {...register("amount")} placeholder="R$ 0,00" className="bg-background" />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Controller name="category_id" control={control} render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )} />
            {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Data de Vencimento</Label>
            <Controller name="due_date" control={control} render={({ field }) => (
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
            {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Controller name="is_recurring" control={control} render={({ field }) => (
              <Checkbox
                id="is_recurring"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )} />
            <Label htmlFor="is_recurring">Marcar como recorrente</Label>
          </div>

          {isRecurring && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="recurrence_interval">Intervalo de Recorrência</Label>
                <Controller name="recurrence_interval" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrenceIntervals.map((interval) => (
                        <SelectItem key={interval} value={interval}>
                          {interval === 'daily' && 'Diário'}
                          {interval === 'weekly' && 'Semanal'}
                          {interval === 'monthly' && 'Mensal'}
                          {interval === 'yearly' && 'Anual'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.recurrence_interval && <p className="text-red-500 text-sm">{errors.recurrence_interval.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label>Data Final da Recorrência (Opcional)</Label>
                <Controller name="recurrence_end_date" control={control} render={({ field }) => (
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
                {errors.recurrence_end_date && <p className="text-red-500 text-sm">{errors.recurrence_end_date.message}</p>}
              </div>
            </>
          )}

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