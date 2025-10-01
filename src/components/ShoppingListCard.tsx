import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ShoppingList } from "@/types/shoppingList";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddShoppingListItemDialog } from "./AddShoppingListItemDialog";
import { ShoppingListItemComponent } from "./ShoppingListItemComponent";
import { DeleteShoppingListDialog } from "./DeleteShoppingListDialog";
import { EditShoppingListDialog } from "./EditShoppingListDialog";

interface ShoppingListCardProps {
  list: ShoppingList;
}

const deleteShoppingList = async (listId: string) => {
  const { error } = await supabase.from("shopping_lists").delete().eq("id", listId);
  if (error) throw new Error(error.message);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const ShoppingListCard = ({ list }: ShoppingListCardProps) => {
  const queryClient = useQueryClient();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const totalItems = list.items.length;
  const purchasedItems = list.items.filter(item => item.is_purchased).length;
  
  // Modificação aqui: calcular o total apenas dos itens comprados
  const totalAmount = useMemo(() => {
    return list.items.reduce((sum, item) => {
      if (item.is_purchased) {
        return sum + (item.price || 0);
      }
      return sum;
    }, 0);
  }, [list.items]);

  const deleteListMutation = useMutation({
    mutationFn: deleteShoppingList,
    onSuccess: () => {
      showSuccess("Lista de compras excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
    },
    onError: (err) => {
      showError(`Erro ao excluir lista: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteListMutation.mutate(list.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">{list.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {purchasedItems} de {totalItems} itens comprados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-lg">{formatCurrency(totalAmount)}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar Lista
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" /> Excluir Lista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum item nesta lista.</p>
          ) : (
            list.items.map(item => (
              <ShoppingListItemComponent key={item.id} item={item} />
            ))
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full text-primary hover:text-primary-foreground" onClick={() => setIsAddItemDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </CardFooter>
      </Card>

      {isAddItemDialogOpen && (
        <AddShoppingListItemDialog
          listId={list.id}
          open={isAddItemDialogOpen}
          onOpenChange={setIsAddItemDialogOpen}
        />
      )}
      {isEditDialogOpen && (
        <EditShoppingListDialog
          list={list}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
      <DeleteShoppingListDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={deleteListMutation.isPending}
      />
    </>
  );
};