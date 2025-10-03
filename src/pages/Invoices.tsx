import { useState, useMemo, useEffect } from "react";
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

const getCreditCards = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*").eq("type", "credit_card");
  if (error) throw new Error(error.message);
  return data as Account[];
};

const getInvoices = async (accountId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, transactions(*)")
    .eq("account_id", accountId)
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

const InvoiceDetails = ({ account }: { account: Account }) => {
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", account.id],
    queryFn: () => getInvoices(account.id),
  });

  const invoicesWithTransactions = useMemo(() => {
    return invoices?.filter(inv => inv.transactions && inv.transactions.length > 0) ?? [];
  }, [invoices]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>();

  useEffect(() => {
    if (invoicesWithTransactions.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(invoicesWithTransactions[0].id);
    }
  }, [invoicesWithTransactions, selectedInvoiceId]);

  const payMutation = useMutation({
    mutationFn: payInvoice,
    onSuccess: () => {
      showSuccess("Fatura paga com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["invoices", account.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] }); // Invalidate accounts to update balance
    },
    onError: () => {
      showError("Erro ao pagar fatura.");
    },
  });

  const selectedInvoice = useMemo(() => {
    const invoice = invoicesWithTransactions.find((inv) => inv.id === selectedInvoiceId);
    if (invoice) {
      // Sum of transaction amounts (which are negative for expenses)
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
                {/* Display absolute value of total for invoices */}
                <CardTitle className="text-2xl">{formatCurrency(Math.abs(selectedInvoice.total ?? 0))}</CardTitle>
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
          {selectedInvoice.status !== 'paid' && (
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
                    {/* Display absolute value of transaction amount for invoice details */}
                    <TableCell className="text-right font-medium">{formatCurrency(Math.abs(tx.amount))}</TableCell>
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

const Invoices = () => {
  const { data: creditCards, isLoading } = useQuery({
    queryKey: ["creditCards"],
    queryFn: getCreditCards,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-gray-400 mt-1">Gerencie as faturas dos seus cartões de crédito.</p>
        </div>
      </header>

      {!creditCards || creditCards.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <Info className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhum cartão de crédito encontrado</h3>
          <p className="text-gray-400">Adicione um cartão de crédito para ver suas faturas.</p>
        </div>
      ) : (
        <Tabs defaultValue={creditCards[0].id} className="w-full">
          <TabsList>
            {creditCards.map((card) => (
              <TabsTrigger key={card.id} value={card.id}>{card.name}</TabsTrigger>
            ))}
          </TabsList>
          {creditCards.map((card) => (
            <TabsContent key={card.id} value={card.id}>
              <InvoiceDetails account={card} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default Invoices;