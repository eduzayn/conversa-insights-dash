import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Phone, Mail, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  isFromStudent: boolean;
}

interface Conversation {
  id: number;
  subject: string;
  status: string;
  lastMessage?: string;
  lastMessageAt: string;
  messages: Message[];
}

export default function SuporteChat() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/suporte/conversas']
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/portal/aluno/suporte/mensagens', selectedConversation],
    enabled: !!selectedConversation
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; content: string }) => {
      const response = await fetch('/api/portal/aluno/suporte/mensagens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('student_token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/suporte/mensagens', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/suporte/conversas'] });
      setNewMessage("");
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { subject: string; initialMessage: string }) => {
      const response = await fetch('/api/portal/aluno/suporte/conversas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('student_token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar conversa');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/suporte/conversas'] });
      setSelectedConversation(data.id);
      setShowNewChat(false);
      setNewSubject("");
      toast.success('Conversa criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar conversa. Tente novamente.');
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'aberta': { variant: 'default' as const, label: 'Aberta' },
      'em_andamento': { variant: 'secondary' as const, label: 'Em Andamento' },
      'resolvida': { variant: 'outline' as const, label: 'Resolvida' },
      'fechada': { variant: 'destructive' as const, label: 'Fechada' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim()
    });
  };

  const handleCreateConversation = () => {
    if (!newSubject.trim()) {
      toast.error('Por favor, informe o assunto da conversa.');
      return;
    }
    
    createConversationMutation.mutate({
      subject: newSubject.trim(),
      initialMessage: newMessage.trim() || "Olá, preciso de ajuda."
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="col-span-2 h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suporte e Chat</h1>
        <p className="text-gray-600">Entre em contato conosco para esclarecer dúvidas e obter ajuda</p>
      </div>

      {/* Informações de contato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-sm text-gray-600">(11) 3333-4444</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">E-mail</p>
                <p className="text-sm text-gray-600">suporte@educacional.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Horário</p>
                <p className="text-sm text-gray-600">Seg-Sex 8h-18h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Lista de conversas */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Minhas Conversas</CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowNewChat(true)}
                disabled={showNewChat}
              >
                Nova Conversa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {showNewChat && (
                <div className="p-4 border-b bg-blue-50">
                  <div className="space-y-2">
                    <Input
                      placeholder="Assunto da conversa"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                    />
                    <Textarea
                      placeholder="Sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleCreateConversation}
                        disabled={createConversationMutation.isPending}
                      >
                        Criar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setShowNewChat(false);
                          setNewSubject("");
                          setNewMessage("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                </div>
              ) : (
                conversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm truncate">{conversation.subject}</p>
                      <Badge variant={getStatusBadge(conversation.status).variant} className="text-xs">
                        {getStatusBadge(conversation.status).label}
                      </Badge>
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.lastMessage}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(conversation.lastMessageAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Área de mensagens */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedConversation 
                ? conversations.find((c: Conversation) => c.id === selectedConversation)?.subject 
                : 'Selecione uma conversa'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedConversation ? (
              <>
                {/* Mensagens */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromStudent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.isFromStudent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isFromStudent ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de nova mensagem */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}