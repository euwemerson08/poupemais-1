import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receivable } from "@/types/receivable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { showError, showSuccess } from "@/utils/toast";
import { useAccounts } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils"; // Importação adicionada

const formSchema = z.object({
  account_id: z.string().min(1, "Conta é obrigatória."),
  received_date: z.date({ required_error: "Data de recebimento é obrigatória." }),
});

interface MarkAsReceivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable;
}

export const MarkAsReceivedDialog = ({ open, onOpenChange, receivable }: MarkAsReceivedDialogProps) => {
  const queryClient = useQueryClient();
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_id: "",
      received_date: new Date(),
    },
  });

  const markAsReceivedMutation = useMutation({
    mutationFn: async ({ receivableId, accountId, receivedDate, isRecurringTemplate }: { receivableId: string; accountId: string; receivedDate: Date; isRecurringTemplate: boolean }) => {
      if (isRecurringTemplate) {
        const { error } = await supabase.rpc('create_and_mark_recurring_receivable_instance_as_received', {
          p_recurring_receivable_id: receivableId,
          p_account_id: accountId,
          p_received_date: format(receivedDate, 'yyyy-MM-dd'),
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.rpc('mark_receivable_as_received', {
          p_receivable_id: receivableId,
          p_account_id: accountId,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      showSuccess("Recebimento marcado como recebido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_receivables"] }); // Invalidate recurring too
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onOpenChange(false);
    },
    onError: (err) => {
      showError(`Erro ao marcar recebimento: ${err.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    markAsReceivedMutation.mutate({
      receivableId: receivable.id,
      accountId: values.account_id,
      receivedDate: values.received_date,
      isRecurringTemplate: !!receivable.is_recurring_template,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Marcar como Recebido</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="received_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Recebimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"> {/* Ajustado para responsividade */}
              <Button type="submit" disabled={markAsReceivedMutation.isPending}>
                {markAsReceivedMutation.isPending ? "Recebendo..." : "Confirmar Recebimento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};