import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Receivable, ReceivableFormData, receivableSchema } from "@/types/receivable";
import { CategoryPicker, categories } from "./CategoryPicker";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

const updateReceivable = async ({ id, ...formData }: ReceivableFormData & { id: string }) => {
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  if (!selectedCategory) throw new Error("Categoria inválida");

  const amountAsNumber = parseFloat(String(formData.amount).replace("R$ ", "").replace(".", "").replace(",", "."));

  const { error } = await supabase.from("receivables").update({
    description: formData.description,
    amount: amountAsNumber,
    due_date: formData.due_date ? format(formData.due_date, "yyyy-MM-dd") : null,
    category_name: selectedCategory.name,
    category_icon: selectedCategory.icon.displayName,
  }).eq('id', id);

  if (error) throw new Error(error.message);
};

interface EditReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable;
}

export const EditReceivableDialog = ({ open, onOpenChange, receivable }: EditReceivableDialogProps) => {
  const queryClient = useQueryClient();

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema),
  });

  useEffect(() => {
    if (receivable) {
      const category = categories.find(c => c.name === receivable.category_name);
      reset({
        description: receivable.description,
        amount: String(receivable.amount.toFixed(2)).replace('.', ','),
        due_date: parseISO(receivable.due_date),
        category_id: category?.id,
        is_recurring: false, // Always false for single receivables
      });
    }
  }, [receivable, reset]);

  const mutation = useMutation({
    mutationFn: updateReceivable,
    onSuccess: () => {
      showSuccess("Conta a receber atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao atualizar conta a receber: ${err.message}`);
    },
  });

  const onSubmit = (data: ReceivableFormData) => {
    mutation.mutate({ ...data, id: receivable.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
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
              <Label>Data de Vencimento</Label>
              <Controller name="due_date" control={control} render={({ field }) => (
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
              {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Controller name="category_id" control={control} render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )} />
            {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id.message}</p>}
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