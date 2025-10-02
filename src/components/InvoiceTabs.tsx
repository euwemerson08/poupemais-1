import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/account";
import { Invoice } from "@/types/invoice";
import { showError, showSuccess } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Loader2, CreditCard, Calendar, Info, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Funções de busca de faturas
const getOpenAndClosedInvoices = async (accountId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, transactions(*)")
    .eq("account_id", accountId)
    .neq("status", "paid") // Filtra faturas que não estão pagas
    .order("closing_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Invoice[];
};

const getPaidInvoices = async (accountId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, transactions(*)")
    .eq("account_id", accountId)
    .eq("status", "paid") // Apenas faturas pagas
    .order("closing_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Invoice[];
};

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

interface InvoiceDetailsProps {
  account: Account;
  invoices: Invoice[] | undefined;
  isLoading: boolean;
  isHistory: boolean;
}

const InvoiceDetails = ({ account, invoices, isLoading, isHistory }: InvoiceDetailsProps) => {
  const queryClient = useQueryClient();

  const invoicesWithTransactions = useMemo(() => {
    return invoices?.filter(inv => inv.transactions && inv.transactions.length > 0) ?? [];
  }, [invoices]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>();

  useEffect(() => {
    if (invoicesWithTransactions.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(invoicesWithTransactions[0].id);
    } else if (invoicesWithTransactions.length === 0) {
      setSelectedInvoiceId(undefined);
    }
  }, [invoicesWithTransactions, selectedInvoiceId]);

  const payMutation = useMutation({
    mutationFn: payInvoice,
    onSuccess: () => {
      showSuccess("Fatura paga com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["invoices", account.id, "open_and_closed"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", account.id, "paid"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
    onError: () => {
      showError("Erro ao pagar fatura.");
    },
  });

  const selectedInvoice = useMemo(() => {
    const invoice = invoicesWithTransactions.find((inv) => inv.id === selectedInvoiceId);
    if (invoice) {
      const total = invoice.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      return { ...invoice, total };
    }
    return undefined;
  }, [invoicesWithTransactions, selectedInvoiceId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (invoicesWithTransactions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
        <CreditCard className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold">Nenhuma fatura encontrada</h3>
        <p className="text-gray-400">Ainda não há faturas com transações para este cartão.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Select onValueChange={setSelectedInvoiceId} value={selectedInvoiceId}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Selecione uma fatura" />
        </SelectTrigger>
        <SelectContent>
          {invoicesWithTransactions.map((invoice) => (
            <SelectItem key={invoice.id} value={invoice.id}>
              Fatura de {format(parseISO(invoice.closing_date), "MMMM 'de' yyyy", { locale: ptBR })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedInvoice && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{formatCurrency(selectedInvoice.total ?? 0)}</CardTitle>
                <p className="text-gray-400">Valor total da fatura</p>
              </div>
              <Badge variant={selectedInvoice.status === 'paid' ? 'default' : 'destructive'} className={selectedInvoice.status === 'paid' ? 'bg-green-600' : ''}>
                {selectedInvoice.status === 'open' && 'Em Aberto'}
                {selectedInvoice.status === 'paid' && 'Paga'}
                {selectedInvoice.status === 'closed' && 'Fechada'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Fechamento: <span className="font-semibold">{formatDate(selectedInvoice.closing_date)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Vencimento: <span className="font-semibold">{formatDate(selectedInvoice.due_date)}</span></span>
            </div>
          </CardContent>
          {!isHistory && selectedInvoice.status !== 'paid' && (
            <CardFooter>
              <Button onClick={() => payMutation.mutate(selectedInvoice.id)} disabled={payMutation.isPending}>
                {payMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Marcar como Paga
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {selectedInvoice && selectedInvoice.transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Transações da Fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInvoice.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>
                      {tx.description}
                      {tx.is_installment && <span className="text-xs text-gray-400 ml-2">{tx.installment_number}/{tx.total_installments}</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center text-gray-400 py-8">Nenhuma transação nesta fatura.</div>
      )}
    </div>
  );
};

interface InvoiceTabsProps {
  account: Account;
}

export const InvoiceTabs = ({ account }: InvoiceTabsProps) => {
  const { data: openAndClosedInvoices, isLoading: isLoadingOpen } = useQuery({
    queryKey: ["invoices", account.id, "open_and_closed"],
    queryFn: () => getOpenAndClosedInvoices(account.id),
  });

  const { data: paidInvoices, isLoading: isLoadingPaid } = useQuery({
    queryKey: ["invoices", account.id, "paid"],
    queryFn: () => getPaidInvoices(account.id),
  });

  return (
    <Tabs defaultValue="current" className="mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="current">Faturas Atuais</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>
      <TabsContent value="current">
        <InvoiceDetails
          account={account}
          invoices={openAndClosedInvoices}
          isLoading={isLoadingOpen}
          isHistory={false}
        />
      </TabsContent>
      <TabsContent value="history">
        <InvoiceDetails
          account={account}
          invoices={paidInvoices}
          isLoading={isLoadingPaid}
          isHistory={true}
        />
      </TabsContent>
    </Tabs>
  );
};