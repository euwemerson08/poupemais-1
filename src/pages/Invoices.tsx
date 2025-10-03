import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/account";
import { Invoice } from "@/types/invoice";
import { showError } from "@/utils/toast";

import { Loader2, CreditCard, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceDisplay } from "@/components/InvoiceDisplay";
import { InvoiceTransactionsTable } from "@/components/InvoiceTransactionsTable";
import { InvoiceHistory } from "@/components/InvoiceHistory";
import { parseISO } from "date-fns";

const getCreditCards = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*").eq("type", "credit_card");
  if (error) throw new Error(error.message);
  return data as Account[];
};

const getAllInvoicesForAccount = async (accountId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, transactions(*)")
    .eq("account_id", accountId)
    .order("closing_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Invoice[];
};

const Invoices = () => {
  const queryClient = useQueryClient();
  const { data: creditCards, isLoading: isLoadingCreditCards } = useQuery({
    queryKey: ["creditCards"],
    queryFn: getCreditCards,
  });

  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();

  useEffect(() => {
    if (creditCards && creditCards.length > 0 && !selectedCardId) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  const { data: allInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", selectedCardId],
    queryFn: () => getAllInvoicesForAccount(selectedCardId!),
    enabled: !!selectedCardId,
  });

  const handleInvoicePaid = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices", selectedCardId] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  const currentOpenInvoice = useMemo(() => {
    if (!allInvoices || !selectedCardId || !creditCards) return undefined;

    const currentCard = creditCards.find(card => card.id === selectedCardId);
    if (!currentCard || !currentCard.closing_day) return undefined;

    const today = new Date();
    const closingDay = currentCard.closing_day;

    let targetClosingDate: Date;
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYear = today.getFullYear();

    // Determine the effective closing day for the current month
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const effectiveClosingDay = Math.min(closingDay, lastDayOfCurrentMonth);

    if (currentDay > effectiveClosingDay) {
      // If today is after the closing day, the current open invoice is for the next month's cycle
      targetClosingDate = new Date(currentYear, currentMonth + 1, effectiveClosingDay);
    } else {
      // If today is on or before the closing day, the current open invoice is for the current month's cycle
      targetClosingDate = new Date(currentYear, currentMonth, effectiveClosingDay);
    }

    // Normalize targetClosingDate to start of day for comparison
    targetClosingDate.setHours(0, 0, 0, 0);

    // Find the invoice that matches this calculated targetClosingDate and is 'open'
    const foundInvoice = allInvoices.find(inv => {
      const invoiceClosingDate = parseISO(inv.closing_date);
      invoiceClosingDate.setHours(0, 0, 0, 0); // Normalize for comparison
      return inv.status === 'open' && invoiceClosingDate.getTime() === targetClosingDate.getTime();
    });

    console.log("Invoices.tsx - currentOpenInvoice debug:");
    console.log("  Selected Card ID:", selectedCardId);
    console.log("  Current Card Closing Day:", currentCard.closing_day);
    console.log("  Today:", today.toISOString());
    console.log("  Calculated Target Closing Date:", targetClosingDate.toISOString());
    console.log("  All Invoices:", allInvoices.map(inv => ({ id: inv.id, status: inv.status, closing_date: inv.closing_date })));
    console.log("  Found Open Invoice:", foundInvoice ? { id: foundInvoice.id, status: foundInvoice.status, closing_date: foundInvoice.closing_date } : "None");

    return foundInvoice;
  }, [allInvoices, selectedCardId, creditCards]);

  if (isLoadingCreditCards || isLoadingInvoices) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!creditCards || creditCards.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
        <Info className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold">Nenhum cartão de crédito encontrado</h3>
        <p className="text-gray-400">Adicione um cartão de crédito para ver suas faturas.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-gray-400 mt-1">Gerencie as faturas dos seus cartões de crédito.</p>
        </div>
      </header>

      <Tabs defaultValue={selectedCardId} onValueChange={setSelectedCardId} className="w-full">
        <TabsList>
          {creditCards.map((card) => (
            <TabsTrigger key={card.id} value={card.id}>{card.name}</TabsTrigger>
          ))}
        </TabsList>
        {creditCards.map((card) => (
          <TabsContent key={card.id} value={card.id}>
            <div className="space-y-8">
              <h2 className="text-2xl font-bold mt-4">Fatura Atual</h2>
              {currentOpenInvoice ? (
                <InvoiceDisplay invoice={currentOpenInvoice} account={card} onInvoicePaid={handleInvoicePaid} />
              ) : (
                <div className="flex flex-col justify-center items-center h-48 bg-card rounded-lg">
                  <CreditCard className="h-10 w-10 text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma fatura aberta.</h3>
                  <p className="text-gray-400">Novas transações criarão uma fatura automaticamente.</p>
                </div>
              )}
              {currentOpenInvoice && <InvoiceTransactionsTable transactions={currentOpenInvoice.transactions} />}

              <h2 className="text-2xl font-bold mt-8">Histórico de Faturas</h2>
              {allInvoices && <InvoiceHistory accountId={card.id} allInvoices={allInvoices} onInvoicePaid={handleInvoicePaid} />}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Invoices;