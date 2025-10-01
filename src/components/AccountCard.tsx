import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { EditAccountDialog } from "./EditAccountDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { Account } from "@/types/account";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const deleteAccount = async (id: string) => {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

interface AccountCardProps {
  account: Account;
  icon: React.ReactNode;
  className?: string;
}

export const AccountCard = ({ account, icon, className }: AccountCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const typeLabels = { wallet: 'Wallet', checking: 'Checking', credit_card: 'Credit Card' };
  const balanceLabel = account.type === 'credit_card' ? 'Fatura Atual' : 'Saldo';

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      showSuccess("Conta excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => {
      showError("Erro ao excluir conta.");
    },
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate(account.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className={cn("border-none text-white p-6 flex flex-col justify-between h-56 rounded-2xl", className)}>
        <div>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {icon}
              <div>
                <h3 className="font-bold text-lg">{account.name}</h3>
                <p className="text-sm text-gray-300">{typeLabels[account.type]}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-400 hover:text-white p-1 rounded-full">
                  <MoreVertical size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setIsDeleteDialogOpen(true)}
                  className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-sm text-gray-300">{balanceLabel}</p>
          <p className="text-3xl font-bold">R$ {Number(account.balance).toFixed(2).replace('.', ',')}</p>
          {account.limit && <p className="text-sm text-gray-400 mt-1">Limite: R$ {Number(account.limit).toFixed(2).replace('.', ',')}</p>}
        </div>
      </Card>

      {isEditDialogOpen && (
        <EditAccountDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          account={account}
        />
      )}
      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};