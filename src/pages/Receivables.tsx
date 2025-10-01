import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receivable } from "@/types/receivable";
import { AddReceivableDialog } from "@/components/AddReceivableDialog";
import { ReceivableItem } from "@/components/ReceivableItem";
import { Loader2, FileText } from "lucide-react";

const getReceivables = async (): Promise<Receivable[]> => {
  const { data, error } = await supabase
    .from("receivables")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Receivable[];
};

const Receivables = () => {
  const { data: receivables, isLoading } = useQuery({
    queryKey: ["receivables"],
    queryFn: getReceivables,
  });

  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus recebimentos futuros e valores a receber.
          </p>
        </div>
        <AddReceivableDialog />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : receivables && receivables.length > 0 ? (
        <div className="bg-card rounded-lg">
          <div className="divide-y divide-border">
            {receivables.map((item) => (
              <ReceivableItem key={item.id} receivable={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 bg-card rounded-lg">
          <FileText className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma conta a receber</h3>
          <p className="text-gray-400">Você não tem nenhum recebimento pendente.</p>
        </div>
      )}
    </div>
  );
};

export default Receivables;