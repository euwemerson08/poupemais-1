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
    return allInvoices?.find(inv => inv.status === 'open');
  }, [allInvoices]);

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