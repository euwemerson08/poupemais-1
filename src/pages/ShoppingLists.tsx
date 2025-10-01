import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingList } from "@/types/shoppingList";
import { AddShoppingListDialog } from "@/components/AddShoppingListDialog";
import { ShoppingListCard } from "@/components/ShoppingListCard";
import { Loader2, List } from "lucide-react";
import { showError } from "@/utils/toast";

const getShoppingLists = async (): Promise<ShoppingList[]> => {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, items:shopping_list_items(*)") // Fetch items nested within each list
    .order("created_at", { ascending: false });

  if (error) {
    showError("Erro ao buscar listas de compras.");
    throw new Error(error.message);
  }
  return data as ShoppingList[];
};

const ShoppingLists = () => {
  const { data: shoppingLists, isLoading } = useQuery({
    queryKey: ["shopping_lists"],
    queryFn: getShoppingLists,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Listas de Compras</h1>
          <p className="text-gray-400 mt-1">
            Crie e gerencie suas listas para não esquecer de nada.
          </p>
        </div>
        <AddShoppingListDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : shoppingLists && shoppingLists.length > 0 ? (
        <section className="grid grid-cols-1 gap-6">
          {shoppingLists.map((list) => (
            <ShoppingListCard key={list.id} list={list} />
          ))}
        </section>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <List className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma lista de compras encontrada</h3>
          <p className="text-gray-400">Comece criando sua primeira lista!</p>
        </div>
      )}
    </div>
  );
};

export default ShoppingLists;