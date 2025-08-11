import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, BookOpen, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "novo_conteudo" | "nova_avaliacao" | "prazo_avaliacao" | "sistema";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    disciplina?: string;
    professorNome?: string;
    url?: string;
  };
}

interface NotificationSystemProps {
  studentId?: number;
}

export function NotificationSystem({ studentId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications - seria substituído por dados reais da API
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "novo_conteudo",
      title: "Novo Conteúdo Disponível",
      message: "Prof. João Silva adicionou uma nova vídeo-aula em Algoritmos e Estruturas de Dados I",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
      read: false,
      metadata: {
        disciplina: "Algoritmos e Estruturas de Dados I",
        professorNome: "Prof. João Silva",
        url: "/portal-aluno/disciplinas"
      }
    },
    {
      id: "2",
      type: "nova_avaliacao",
      title: "Nova Avaliação Criada",
      message: "Uma nova prova foi criada para a disciplina Programação Orientada a Objetos",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
      read: false,
      metadata: {
        disciplina: "Programação Orientada a Objetos",
        professorNome: "Prof. João Silva",
        url: "/portal-aluno/avaliacoes"
      }
    },
    {
      id: "3",
      type: "prazo_avaliacao",
      title: "Prazo da Avaliação",
      message: "A Prova 1 - Algoritmos Básicos vence em 2 dias",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h atrás
      read: true,
      metadata: {
        disciplina: "Algoritmos e Estruturas de Dados I",
        url: "/portal-aluno/avaliacoes"
      }
    }
  ];

  useEffect(() => {
    // Simular carregamento de notificações
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "novo_conteudo":
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case "nova_avaliacao":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "prazo_avaliacao":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "novo_conteudo":
        return "bg-blue-100 text-blue-800";
      case "nova_avaliacao":
        return "bg-green-100 text-green-800";
      case "prazo_avaliacao":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Agora mesmo";
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[80vh] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {notifications.map(notification => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <CardTitle className="text-sm">{notification.title}</CardTitle>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  
                  {notification.metadata?.disciplina && (
                    <Badge className={getNotificationBadge(notification.type)} variant="outline">
                      {notification.metadata.disciplina}
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                    
                    {notification.metadata?.url && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        Ver detalhes
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}