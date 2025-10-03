import { useState, useMemo, useEffect } from "react";
import { Invoice } from "@/types/invoice";
import { Account } from "@/types/account";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import { History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceDisplay } from "./InvoiceDisplay";
import { InvoiceTransactionsTable } from "./InvoiceTransactionsTable";

interface InvoiceHistoryProps {
  accountId: string;
  allInvoices: Invoice[];
  onInvoicePaid: () => void;
}

export const InvoiceHistory = ({ accountId, allInvoices, onInvoicePaid }: InvoiceHistoryProps) => {
  const currentYear = getYear(new Date());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all'); // 'all' for all months

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allInvoices.forEach(inv => years.add(getYear(parseISO(inv.closing_date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [allInvoices]);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice => {
      const invoiceYear = getYear(parseISO(invoice.closing_date));
      const invoiceMonth = getMonth(parseISO(invoice.closing_date)); // 0-indexed

      const matchesYear = invoiceYear === selectedYear;
      const matchesMonth = selectedMonth === 'all' || invoiceMonth === selectedMonth;

      return matchesYear && matchesMonth && invoice.status !== 'open'; // Only show closed/paid in history
    }).sort((a, b) => parseISO(b.closing_date).getTime() - parseISO(a.closing_date).getTime()); // Sort by most recent first
  }, [allInvoices, selectedYear, selectedMonth]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(currentYear, i, 1), "MMMM", { locale: ptBR }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select onValueChange={(value) => setSelectedYear(Number(value))} value={String(selectedYear)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSelectedMonth(value === 'all' ? 'all' : Number(value))} value={String(selectedMonth)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {months.map(month => (
              <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-48 bg-card rounded-lg">
          <History className="h-10 w-10 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma fatura no histórico para este período.</h3>
          <p className="text-gray-400">Tente ajustar os filtros de ano e mês.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInvoices.map(invoice => (
            <div key={invoice.id} className="border rounded-lg p-4 bg-card">
              <h4 className="font-bold text-lg mb-2">
                Fatura de {format(parseISO(invoice.closing_date), "MMMM 'de' yyyy", { locale: ptBR })}
              </h4>
              <InvoiceDisplay invoice={invoice} account={{ id: accountId } as Account} onInvoicePaid={onInvoicePaid} />
              <div className="mt-4">
                <InvoiceTransactionsTable transactions={invoice.transactions} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};