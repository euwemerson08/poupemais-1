import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/account";
import { Invoice } from "@/types/invoice";
import { showError, showSuccess } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Loader2, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const payInvoice = async (invoiceId: string) => {
  const { error } = await supabase.rpc('pay_invoice', { invoice_id_param: invoiceId });
  if (error) throw new Error(error.message);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (dateString: string) => {
  return format(parseISO(dateString), "dd/MM/yyyy");
};

interface InvoiceDisplayProps {
  invoice: Invoice;
  account: Account;
  onInvoicePaid: () => void;
}

export const InvoiceDisplay = ({ invoice, account, onInvoicePaid }: InvoiceDisplayProps) => {
  const payMutation = useMutation({
    mutationFn: payInvoice,
    onSuccess: () => {
      showSuccess("Fatura paga com sucesso!");
      onInvoicePaid(); // Callback to invalidate queries in parent
    },
    onError: (err) => {
      showError(`Erro ao pagar fatura: ${err.message}`);
    },
  });

  // For paid invoices, use the stored total_amount. For open/closed, calculate from transactions.
  const currentTotal = useMemo(() => {
    if (invoice.status === 'paid' && invoice.total_amount !== null) {
      return invoice.total_amount;
    }
    return invoice.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [invoice]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{formatCurrency(currentTotal)}</CardTitle>
            <p className="text-gray-400">Valor total da fatura</p>
          </div>
          <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'} className={invoice.status === 'paid' ? 'bg-green-600' : ''}>
            {invoice.status === 'open' && 'Em Aberto'}
            {invoice.status === 'paid' && 'Paga'}
            {invoice.status === 'closed' && 'Fechada'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>Fechamento: <span className="font-semibold">{formatDate(invoice.closing_date)}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>Vencimento: <span className="font-semibold">{formatDate(invoice.due_date)}</span></span>
        </div>
      </CardContent>
      {invoice.status !== 'paid' && (
        <CardFooter>
          <Button onClick={() => payMutation.mutate(invoice.id)} disabled={payMutation.isPending}>
            {payMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Marcar como Paga
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};