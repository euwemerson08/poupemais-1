import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";
import { format, addMonths, getMonth, getYear, isSameMonth, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface InvoiceTabsProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  onSelectInvoice: (invoiceId: string | null) => void;
  selectedInvoiceId: string | null;
}

const getInvoices = async (month: number, year: number): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, accounts(name, type, color, icon)")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .eq("status", "open")
    .or(`and(extract(month from due_date).eq.${month},extract(year from due_date).eq.${year}),and(extract(month from closing_date).eq.${month},extract(year from closing_date).eq.${year})`);
  if (error) throw new Error(error.message);
  return data.map(inv => ({
    ...inv,
    account_name: inv.accounts?.name || 'N/A',
    account_type: inv.accounts?.type || 'N/A',
    account_color: inv.accounts?.color || '#000000',
    account_icon: inv.accounts?.icon || 'Wallet',
  })) as Invoice[];
};

export const InvoiceTabs = ({
  currentMonth,
  currentYear,
  onMonthChange,
  onSelectInvoice,
  selectedInvoiceId,
}: InvoiceTabsProps) => {
  const queryClient = useQueryClient();

  // Fetch invoices for the currently displayed month/year (for the main view)
  const { data: currentMonthInvoices, isLoading: isLoadingCurrentMonthInvoices } = useQuery({
    queryKey: ["invoices", currentMonth, currentYear],
    queryFn: () => getInvoices(currentMonth, currentYear),
  });

  // Determine actual current month and next month for the dropdown
  const today = new Date();
  const actualCurrentMonth = getMonth(today) + 1; // 1-indexed
  const actualCurrentYear = getYear(today);
  const nextMonthDate = addMonths(today, 1);
  const actualNextMonth = getMonth(nextMonthDate) + 1;
  const actualNextYear = getYear(nextMonthDate);

  // Fetch invoices for the actual current month and next month for the dropdown
  const { data: dropdownInvoices, isLoading: isLoadingDropdownInvoices } = useQuery({
    queryKey: ["dropdownInvoices", actualCurrentMonth, actualCurrentYear, actualNextMonth, actualNextYear],
    queryFn: async () => {
      const currentMonthData = await getInvoices(actualCurrentMonth, actualCurrentYear);
      const nextMonthData = await getInvoices(actualNextMonth, actualNextYear);
      
      // Combine and remove duplicates (if an invoice appears in both queries)
      const combined = [...currentMonthData, ...nextMonthData];
      const uniqueInvoices = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      // Sort by due_date
      return uniqueInvoices.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    },
  });

  const handleMonthChange = (direction: "prev" | "next") => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "prev") {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }
    onMonthChange(newMonth, newYear);
    onSelectInvoice(null); // Reset selected invoice when month changes
  };

  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy", { locale: ptBR });

  const handleInvoiceSelect = (value: string) => {
    onSelectInvoice(value === "all" ? null : value);
  };

  return (
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

      <Tabs defaultValue="all" className="w-full sm:w-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" onClick={() => onSelectInvoice(null)}>Todas as Transações</TabsTrigger>
          <TabsTrigger value="invoices" onClick={() => onSelectInvoice(dropdownInvoices?.[0]?.id || null)}>Faturas</TabsTrigger>
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
            dropdownInvoices?.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id}>
                {invoice.account_name} - {format(new Date(invoice.due_date), "MM/yyyy", { locale: ptBR })} ({invoice.status === 'open' ? 'Aberta' : 'Paga'})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};