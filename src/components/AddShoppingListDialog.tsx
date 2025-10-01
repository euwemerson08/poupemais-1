import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ShoppingListFormData, shoppingListSchema } from "@/types/shoppingList";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

const createShoppingList = async (listData: ShoppingListFormData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("shopping_lists").insert({
    name: listData.name,
    user_id: user.id,
  });
  if (error) throw new Error(error.message);
};

export const AddShoppingListDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShoppingListFormData>({
    resolver: zodResolver(shoppingListSchema),
  });

  const mutation = useMutation({
    mutationFn: createShoppingList,
    onSuccess: () => {
      showSuccess("Lista de compras criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["shopping_lists"] });
      setOpen(false);
      reset();
    },
    onError: (err) => {
      showError(`Erro ao criar lista: ${err.message}`);
    },
  });

  const onSubmit = (data: ShoppingListFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E63980] hover:bg-[#d63374] text-white font-semibold">
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Lista
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Criar Nova Lista de Compras</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Lista</Label>
            <Input id="name" {...register("name")} placeholder="Ex: Compras da Semana" className="bg-background" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-[#E63980] hover:bg-[#d63374] text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar Lista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};