import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showError, showSuccess } from "@/utils/toast";

interface UserPreferences {
  id: string;
  user_id: string;
  reminders_enabled: boolean;
  marketing_emails_enabled: boolean;
}

const fetchUserPreferences = async (): Promise<UserPreferences | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw new Error(error.message);
  }
  return data;
};

const updateUserPreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("user_preferences")
    .update(preferences)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const NotificationSettingsCard = () => {
  const queryClient = useQueryClient();
  const { data: preferences, isLoading, error } = useQuery<UserPreferences | null>({
    queryKey: ["user_preferences"],
    queryFn: fetchUserPreferences,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(["user_preferences"], updatedData);
      showSuccess("Preferências de notificação atualizadas!");
    },
    onError: (err) => {
      showError(`Erro ao atualizar preferências: ${err.message}`);
    },
  });

  const handleSwitchChange = (key: keyof UserPreferences, checked: boolean) => {
    if (preferences) {
      updatePreferencesMutation.mutate({ [key]: checked });
    }
  };

  if (isLoading) {
    return <Card className="bg-card border-border"><CardContent className="p-6 text-center">Carregando configurações...</CardContent></Card>;
  }

  if (error) {
    return <Card className="bg-card border-border"><CardContent className="p-6 text-center text-red-500">Erro ao carregar configurações: {error.message}</CardContent></Card>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
        <CardDescription>Gerencie como você recebe notificações sobre sua conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="reminders" className="text-base">Lembretes de Vencimento</Label>
            <p className="text-sm text-muted-foreground">
              Receba notificações sobre contas a pagar e a receber.
            </p>
          </div>
          <Switch
            id="reminders"
            checked={preferences?.reminders_enabled || false}
            onCheckedChange={(checked) => handleSwitchChange("reminders_enabled", checked)}
            disabled={updatePreferencesMutation.isPending}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="marketing" className="text-base">E-mails de Marketing</Label>
            <p className="text-sm text-muted-foreground">
              Receba e-mails sobre novos recursos, produtos e ofertas.
            </p>
          </div>
          <Switch
            id="marketing"
            checked={preferences?.marketing_emails_enabled || false}
            onCheckedChange={(checked) => handleSwitchChange("marketing_emails_enabled", checked)}
            disabled={updatePreferencesMutation.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
};