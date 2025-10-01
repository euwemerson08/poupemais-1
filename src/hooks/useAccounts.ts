import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/account";
import { showError } from "@/utils/toast";

const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase.from("accounts").select("*");
  if (error) {
    showError("Erro ao buscar contas.");
    throw new Error(error.message);
  }
  return data as Account[];
};

export const useAccounts = () => {
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  return { accounts, isLoading, error };
};