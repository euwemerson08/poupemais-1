import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/account";
import { showError } from "@/utils/toast";

import { Loader2, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InvoiceTabs } from "@/components/InvoiceTabs"; // Importar o novo componente

const getCreditCards = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*").eq("type", "credit_card");
  if (error) {
    showError("Erro ao buscar cartões de crédito.");
    throw new Error(error.message);
  }
  return data as Account[];
};

const Invoices = () => {
  const { data: creditCards, isLoading: isLoadingCreditCards } = useQuery({
    queryKey: ["creditCards"],
    queryFn: getCreditCards,
  });

  const [activeCreditCardId, setActiveCreditCardId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (creditCards && creditCards.length > 0 && !activeCreditCardId) {
      setActiveCreditCardId(creditCards[0].id);
    }
  }, [creditCards, activeCreditCardId]);

  if (isLoadingCreditCards) {
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
        <Tabs defaultValue={activeCreditCardId} onValueChange={setActiveCreditCardId} className="w-full">
          <TabsList>
            {creditCards.map((card) => (
              <TabsTrigger key={card.id} value={card.id}>{card.name}</TabsTrigger>
            ))}
          </TabsList>
          {creditCards.map((card) => (
            <TabsContent key={card.id} value={card.id}>
              <InvoiceTabs account={card} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default Invoices;