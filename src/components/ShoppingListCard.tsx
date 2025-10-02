import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ShoppingList } from "@/types/shoppingList";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, PlusCircle, Edit, Trash, CheckSquare } from "lucide-react"; // Adicionado CheckSquare
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator, // Adicionado Separator
} from "@/components/ui/dropdown-menu";
import { AddShoppingListItemDialog } from "./AddShoppingListItemDialog";
import { ShoppingListItemComponent } from "./ShoppingListItemComponent";
import { DeleteShoppingListDialog } from "./DeleteShoppingListDialog";
import { EditShoppingListDialog } from "./EditShoppingListDialog";
import { ConfirmDialog } from "./ConfirmDialog"; // Importar ConfirmDialog

interface ShoppingListCardProps {
  list: ShoppingList;
}

const deleteShoppingList = async (listId: string) => {
  const { error } = await supabase.from("shopping_lists").delete().eq("id", listId);
  if (error) throw new Error(error.message);
};

const unmarkAllItems = async (listId: string) => {
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ is_purchased: false })
    .eq("list_id", listId);
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
  const [isUnmarkAllDialogOpen, setIsUnmarkAllDialogOpen] = useState(false); // Novo estado para o diálogo

  const totalItems = list.items.length;
  const purchasedItems = list.items.filter(item => item.is_purchased).length;
  
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

  const unmarkAllMutation = useMutation({
    mutationFn: unmarkAllItems,
    onSuccess: () => {
      showSuccess("Todos os itens foram desmarcados!");
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
    },
    onError: (err) => {
      showError(`Erro ao desmarcar itens: ${err.message}`);
    },
  });

  const handleConfirmDelete = () => {
    deleteListMutation.mutate(list.id);
    setIsDeleteDialogOpen(false);
  };

  const handleConfirmUnmarkAll = () => {
    unmarkAllMutation.mutate(list.id);
    setIsUnmarkAllDialogOpen(false);
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
                {purchasedItems > 0 && ( // Mostrar a opção apenas se houver itens marcados
                  <DropdownMenuItem onSelect={() => setIsUnmarkAllDialogOpen(true)}>
                    <CheckSquare className="mr-2 h-4 w-4" /> Desmarcar Todos
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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
      <ConfirmDialog
        open={isUnmarkAllDialogOpen}
        onOpenChange={setIsUnmarkAllDialogOpen}
        title="Desmarcar todos os itens?"
        description="Tem certeza que deseja desmarcar todos os itens desta lista? Esta ação não pode ser desfeita individualmente."
        onConfirm={handleConfirmUnmarkAll}
        confirmText="Desmarcar"
        isLoading={unmarkAllMutation.isPending}
      />
    </>
  );
};