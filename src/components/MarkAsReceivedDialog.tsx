import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Receivable } from "@/types/receivable";
import { Account } from "@/types/account";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const markAsReceivedSchema = z.object({
  account_id: z.string().uuid("Selecione uma conta para depositar o valor."),
});

type MarkAsReceivedFormData = z.infer<typeof markAsReceivedSchema>;

const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*").neq("type", "credit_card");
  if (error) throw new Error(error.message);
  return data as Account[];
};

const markAsReceived = async ({ receivableId, accountId }: { receivableId: string; accountId: string }) => {
  const { error } = await supabase.rpc('mark_receivable_as_received', {
    p_receivable_id: receivableId,
    p_account_id: accountId,
  });
  if (error) throw new Error(error.message);
};

interface MarkAsReceivedDialogProps {
  receivable: Receivable;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarkAsReceivedDialog = ({ receivable, open, onOpenChange }: MarkAsReceivedDialogProps) => {
  const queryClient = useQueryClient();
  const { data: accounts } = useQuery({ queryKey: ["accounts", "no-credit"], queryFn: getAccounts });
  const { control, handleSubmit, reset, formState: { errors } } = useForm<MarkAsReceivedFormData>({
    resolver: zodResolver(markAsReceivedSchema),
  });

  const mutation = useMutation({
    mutationFn: markAsReceived,
    onSuccess: () => {
      showSuccess("Recebimento confirmado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
      reset();
    },
    onError: (err) => {
      showError(`Erro ao confirmar recebimento: ${err.message}`);
    },
  });

  const onSubmit = (data: MarkAsReceivedFormData) => {
    mutation.mutate({ receivableId: receivable.id, accountId: data.account_id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-none text-foreground">
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="account_id">Depositar na Conta</Label>
            <Controller name="account_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecione uma conta..." /></SelectTrigger>
                <SelectContent>
                  {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.account_id && <p className="text-red-500 text-sm">{errors.account_id.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={mutation.isPending}>
              {mutation.isPending ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};