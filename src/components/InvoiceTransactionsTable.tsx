import { Invoice } from "@/types/invoice";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (dateString: string) => {
  return format(parseISO(dateString), "dd/MM/yyyy");
};

interface InvoiceTransactionsTableProps {
  transactions: Invoice['transactions'];
}

export const InvoiceTransactionsTable = ({ transactions }: InvoiceTransactionsTableProps) => {
  if (transactions.length === 0) {
    return <div className="text-center text-gray-400 py-8">Nenhuma transação nesta fatura.</div>;
  }

  return (
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
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell>
                  {tx.description}
                  {tx.is_installment && <span className="text-xs text-gray-400 ml-2">{tx.installment_number}/{tx.total_installments}</span>}
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(Math.abs(tx.amount))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};