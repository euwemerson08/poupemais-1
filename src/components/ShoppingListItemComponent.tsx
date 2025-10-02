import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ShoppingListItem } from "@/types/shoppingList";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash, UtensilsCrossed } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteShoppingListItemDialog } from "./DeleteShoppingListItemDialog";
import { EditShoppingListItemDialog } from "./EditShoppingListItemDialog";

interface ShoppingListItemComponentProps {
  item: ShoppingListItem;
}

const updateItemPurchasedStatus = async ({ itemId, isPurchased }: { itemId: string; isPurchased: boolean }) => {
  const { error } = await supabase.from("shopping_list_items").update({ is_purchased: isPurchased }).eq("id", itemId);
  if (error) throw new Error(error.message);
};

const deleteItem = async (itemId: string) => {
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const ShoppingListItemComponent = ({ item }: ShoppingListItemComponentProps) => {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const togglePurchasedMutation = useMutation({
    mutationFn: updateItemPurchasedStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
    },
    onError: (err) => {
      showError(`Erro ao atualizar status do item: ${err.message}`);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      showSuccess("Item excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir item: ${err.message}`);
    },
  });

  const handleTogglePurchased = (checked: boolean) => {
    togglePurchasedMutation.mutate({ itemId: item.id, isPurchased: checked });
  };

  const handleConfirmDelete = () => {
    deleteItemMutation.mutate(item.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between py-3 px-4 hover:bg-white/5 transition-colors rounded-md">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={item.is_purchased}
            onCheckedChange={handleTogglePurchased}
            className="h-5 w-5 rounded-full border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <div>
            <p className={`font-medium ${item.is_purchased ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {item.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {item.quantity && `Qtd: ${item.quantity}`}
              {item.quantity && item.price && " - "}
              {item.price && formatCurrency(item.price)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 text-gray-400 hover:text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="h-4 w-4 text-red-500 hover:text-red-400" />
          </Button>
        </div>
      </div>

      {isEditDialogOpen && (
        <EditShoppingListItemDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          item={item}
        />
      )}
      <DeleteShoppingListItemDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={deleteItemMutation.isPending}
      />
    </>
  );
};