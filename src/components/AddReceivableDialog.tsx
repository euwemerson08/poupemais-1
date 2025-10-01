import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ReceivableFormData, receivableSchema } from "@/types/receivable";
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

const createReceivable = async (formData: ReceivableFormData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const selectedCategory = categories.find(c => c.id === formData.category_id);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(String(formData.amount).replace("R$ ", "").replace(".", "").replace(",", "."));

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
};

export const AddReceivableDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema),
    defaultValues: { due_date: new Date() },
  });

  const mutation = useMutation({
    mutationFn: createReceivable,
    onSuccess: () => {
      showSuccess("Conta a receber adicionada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      setOpen(false);
      reset({ due_date: new Date(), description: "", amount: "", category_id: "" });
    },
    onError: (err) => {
      showError(`Erro ao adicionar conta a receber: ${err.message}`);
    },
  });

  const onSubmit = (data: ReceivableFormData) => {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Ajustado para 3 colunas */}
            <div className="grid gap-2 md:col-span-1"> {/* Valor ocupa 1 coluna */}
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" {...register("amount")} placeholder="R$ 0,00" className="bg-background" />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
            </div>
            <div className="grid gap-2 md:col-span-2"> {/* Categoria ocupa 2 colunas */}
              <Label>Categoria</Label>
              <Controller name="category_id" control={control} render={({ field }) => (
                <CategoryPicker value={field.value} onChange={field.onChange} />
              )} />
              {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id.message}</p>}
            </div>
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