import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ShoppingListItem, ShoppingListItemFormData, shoppingListItemSchema } from "@/types/shoppingList";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditShoppingListItemDialogProps {
  item: ShoppingListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditShoppingListItemDialog = ({ item, open, onOpenChange }: EditShoppingListItemDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShoppingListItemFormData>({
    resolver: zodResolver(shoppingListItemSchema),
  });

  useEffect(() => {
    if (item) {
      reset({
        description: item.description,
        quantity: item.quantity || "",
        price: item.price || undefined,
      });
    }
  }, [item, reset]);

  const mutation = useMutation({
    mutationFn: async (itemData: ShoppingListItemFormData) => {
      const { error } = await supabase.from("shopping_list_items").update({
        description: itemData.description,
        quantity: itemData.quantity || null,
        price: itemData.price || null,
      }).eq('id', item.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Item atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao atualizar item: ${err.message}`);
    },
  });

  const onSubmit = (data: ShoppingListItemFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Editar Item: {item.description}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} className="bg-background" />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Ajustado para responsividade */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" {...register("quantity")} className="bg-background" />
              {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço Unitário (Opcional)</Label>
              <Input id="price" {...register("price")} className="bg-background" />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
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