"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import React from "react";

export const NotificationSettings = () => {
  // Aqui você pode adicionar o estado e a lógica para gerenciar as configurações de notificação
  // Por enquanto, os checkboxes serão apenas visuais.
  const [remindersEnabled, setRemindersEnabled] = React.useState(true);
  const [monthlySummariesEnabled, setMonthlySummariesEnabled] = React.useState(false);

  return (
    <Card className="bg-card border-none">
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        <Bell className="h-5 w-5 text-gray-400" />
        <CardTitle className="text-lg font-semibold">Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="reminders" className="text-base">Lembretes de Vencimento</Label>
            <p className="text-sm text-muted-foreground">
              Receba alertas sobre contas a pagar e a receber.
            </p>
          </div>
          <Checkbox
            id="reminders"
            checked={remindersEnabled}
            onCheckedChange={(checked) => setRemindersEnabled(!!checked)}
            className="h-5 w-5"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="monthly-summaries" className="text-base">Resumos Mensais</Label>
            <p className="text-sm text-muted-foreground">
              Receba um resumo de suas finanças por email no final do mês.
            </p>
          </div>
          <Checkbox
            id="monthly-summaries"
            checked={monthlySummariesEnabled}
            onCheckedChange={(checked) => setMonthlySummariesEnabled(!!checked)}
            className="h-5 w-5"
          />
        </div>
      </CardContent>
    </Card>
  );
};