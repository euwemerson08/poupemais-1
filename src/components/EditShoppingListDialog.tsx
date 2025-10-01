import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ShoppingList, ShoppingListFormData, shoppingListSchema } from "@/types/shoppingList";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditShoppingListDialogProps {
  list: ShoppingList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditShoppingListDialog = ({ list, open, onOpenChange }: EditShoppingListDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShoppingListFormData>({
    resolver: zodResolver(shoppingListSchema),
  });

  useEffect(() => {
    if (list) {
      reset({ name: list.name });
    }
  }, [list, reset]);

  const mutation = useMutation({
    mutationFn: async (listData: ShoppingListFormData) => {
      const { error } = await supabase.from("shopping_lists").update({
        name: listData.name,
      }).eq('id', list.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Lista atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao atualizar lista: ${err.message}`);
    },
  });

  const onSubmit = (data: ShoppingListFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Lista: {list.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Lista</Label>
            <Input id="name" {...register("name")} className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
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