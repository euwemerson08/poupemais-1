import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";
import { Account } from "@/types/account"; // Importar o tipo Account
import { format, addMonths, subMonths, getMonth, getYear, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Adicionado Card para a estrutura
import { TransactionItem } from "./TransactionItem"; // Adicionado TransactionItem
import { Separator } from "@/components/ui/separator"; // Adicionado Separator
import { Loader2, Info } from "lucide-react"; // Adicionado Loader2 e Info

interface InvoiceTabsProps {
  account: Account; // Agora aceita um objeto Account
}

const getInvoicesForAccount = async (accountId: string, month: number, year: number): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, accounts(name, type, color, icon, balance, limit, closing_day, due_day), transactions(*)") // Selecionar transações também
    .eq("account_id", accountId)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .or(`and(extract(month from due_date).eq.${month},extract(year from due_date).eq.${year}),and(extract(month from closing_date).eq.${month},extract(year from closing_date).eq.${year})`)
    .order("due_date", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(inv => ({
    ...inv,
    account_name: inv.accounts?.name || 'N/A',
    account_type: inv.accounts?.type || 'N/A',
    account_balance: inv.accounts?.balance || 0,
    account_color: inv.accounts?.color || '#000000',
    account_icon: inv.accounts?.icon || 'wallet',
    account_limit: inv.accounts?.limit || null,
    account_closing_day: inv.accounts?.closing_day || null,
    account_due_day: inv.accounts?.due_day || null,
    transactions: inv.transactions || [], // Garantir que transactions é um array
  })) as Invoice[];
};

export const InvoiceTabs = ({ account }: InvoiceTabsProps) => {
  const queryClient = useQueryClient();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "invoices">("all");

  const currentMonth = getMonth(currentDate) + 1;
  const currentYear = getYear(currentDate);

  // Fetch invoices for the currently displayed month/year (for the main view)
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", account.id, currentMonth, currentYear],
    queryFn: () => getInvoicesForAccount(account.id, currentMonth, currentYear),
  });

  // Determine actual current month and next month for the dropdown
  const actualCurrentMonth = getMonth(today) + 1; // 1-indexed
  const actualCurrentYear = getYear(today);
  const nextMonthDate = addMonths(today, 1);
  const actualNextMonth = getMonth(nextMonthDate) + 1;
  const actualNextYear = getYear(nextMonthDate);

  // Fetch invoices for the actual current month and next month for the dropdown
  const { data: dropdownInvoices, isLoading: isLoadingDropdownInvoices } = useQuery({
    queryKey: ["dropdownInvoices", account.id, actualCurrentMonth, actualCurrentYear, actualNextMonth, actualNextYear],
    queryFn: async () => {
      const currentMonthData = await getInvoicesForAccount(account.id, actualCurrentMonth, actualCurrentYear);
      const nextMonthData = await getInvoicesForAccount(account.id, actualNextMonth, actualNextYear);
      
      // Combine and remove duplicates (if an invoice appears in both queries)
      const combined = [...currentMonthData, ...nextMonthData];
      const uniqueInvoices = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      // Sort by due_date
      return uniqueInvoices.sort((a, b) => {
        const dateA = isValid(parseISO(a.due_date)) ? parseISO(a.due_date).getTime() : 0; // Handle invalid dates
        const dateB = isValid(parseISO(b.due_date)) ? parseISO(b.due_date).getTime() : 0; // Handle invalid dates
        return dateA - dateB;
      });
    },
  });

  useEffect(() => {
    // Reset selected invoice when account changes
    setSelectedInvoiceId(null);
    setActiveTab("all");
  }, [account.id]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentDate((prevDate) => (direction === "prev" ? subMonths(prevDate, 1) : addMonths(prevDate, 1)));
    setSelectedInvoiceId(null); // Reset selected invoice when month changes
    setActiveTab("all");
  };

  const monthName = format(currentDate, "MMMM yyyy", { locale: ptBR });

  const handleInvoiceSelect = (value: string) => {
    setSelectedInvoiceId(value === "all" ? null : value);
    setActiveTab("invoices");
  };

  const displayedInvoices = selectedInvoiceId
    ? invoices?.filter(inv => inv.id === selectedInvoiceId)
    : invoices;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-card rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => handleMonthChange("prev")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[120px] text-center">{monthName}</span>
          <Button variant="outline" size="icon" onClick={() => handleMonthChange("next")}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "invoices")} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Todas as Transações</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select onValueChange={handleInvoiceSelect} value={selectedInvoiceId || "all"}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Selecione uma fatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Faturas</SelectItem>
            {isLoadingDropdownInvoices ? (
              <SelectItem value="loading" disabled>Carregando faturas...</SelectItem>
            ) : (
              dropdownInvoices?.map((invoice) => {
                const dueDate = parseISO(invoice.due_date);
                const formattedDueDate = isValid(dueDate) ? format(dueDate, "MM/yyyy", { locale: ptBR }) : 'Data Inválida';
                return (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.account_name} - {formattedDueDate} ({invoice.status === 'open' ? 'Aberta' : 'Paga'})
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>

      {isLoadingInvoices ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : displayedInvoices && displayedInvoices.length > 0 ? (
        <div className="space-y-6">
          {displayedInvoices.map((invoice) => (
            <Card key={invoice.id} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Fatura {format(parseISO(invoice.due_date), "MMMM yyyy", { locale: ptBR })}</CardTitle>
                  <p className="text-sm text-muted-foreground">Vencimento: {format(parseISO(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                  <p className="text-sm text-muted-foreground">Fechamento: {format(parseISO(invoice.closing_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      invoice.transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Status: {invoice.status === 'open' ? 'Aberta' : 'Paga'}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoice.transactions && invoice.transactions.length > 0 ? (
                  <div className="divide-y divide-border">
                    {invoice.transactions.map((transaction) => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Nenhuma transação nesta fatura.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <Info className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma fatura encontrada</h3>
          <p className="text-gray-400">Não há faturas para este período.</p>
        </div>
      )}
    </div>
  );
};