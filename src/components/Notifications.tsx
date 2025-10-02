import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const markAllAsRead = async (userId: string) => {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw new Error(error.message);
};

export const Notifications = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await markAllAsRead(user.id);
      } else {
        throw new Error("Usuário não autenticado.");
      }
    },
    onSuccess: () => {
      showSuccess("Todas as notificações foram marcadas como lidas!");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      showError(`Erro ao marcar notificações como lidas: ${err.message}`);
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-medium text-lg">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {isLoading && <p className="p-4 text-center text-muted-foreground">Carregando notificações...</p>}
          {error && <p className="p-4 text-center text-red-500">Erro ao carregar notificações.</p>}
          {notifications?.length === 0 && !isLoading && (
            <p className="p-4 text-center text-muted-foreground">Nenhuma notificação.</p>
          )}
          {notifications?.map((notification) => (
            <div key={notification.id} className={`p-4 border-b last:border-b-0 ${!notification.read ? "bg-accent/20" : ""}`}>
              <p className="font-semibold text-sm">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};