
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation, Attendant } from "@/types/atendimento-aluno";
import { TransferModal } from "./TransferModal";
import { InternalNotes } from "./InternalNotes";
import { NotificationSettings } from "./NotificationSettings";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Paperclip, Smile, MessageCircle, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  conversation: Conversation | null;
  currentUser: any;
  availableAttendants: Attendant[];
  onSendMessage: (conversationId: string, content: string, currentUser: any) => void;
  onUpdateStatus: (conversationId: string, status: Conversation['status']) => void;
  onTransferConversation: (conversationId: string, fromAttendantId: string, toAttendantId: string, reason?: string) => void;
  onSaveInternalNote: (conversationId: string, content: string, currentUser: any) => void;
}

export const ChatArea = ({ 
  conversation, 
  currentUser, 
  availableAttendants,
  onSendMessage, 
  onUpdateStatus,
  onTransferConversation,
  onSaveInternalNote
}: ChatAreaProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !conversation) return;
    
    onSendMessage(conversation.id, message.trim(), currentUser);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: Conversation['status']) => {
    switch (status) {
      case 'novo':
        return <Badge variant="destructive">Novo</Badge>;
      case 'em_andamento':
        return <Badge className="bg-orange-100 text-orange-800">Em Andamento</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>;
    }
  };

  if (!conversation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Selecione uma conversa
          </h2>
          <p className="text-gray-600">
            Escolha uma conversa da lista para começar a atender o aluno
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {conversation.student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                {conversation.student.name}
                {conversation.hasNewMessage && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </h2>
              <p className="text-sm text-gray-600">
                {conversation.student.course} • {conversation.student.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationSettings />
            <TransferModal 
              conversation={conversation}
              currentUser={currentUser}
              availableAttendants={availableAttendants}
              onTransfer={onTransferConversation}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusBadge(conversation.status)}
            {conversation.attendant && (
              <span className="text-sm text-gray-600">
                Atendente: {conversation.attendant.name}
              </span>
            )}
          </div>
          
          <Select
            value={conversation.status}
            onValueChange={(value: Conversation['status']) => 
              onUpdateStatus(conversation.id, value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((msg) => {
          const isFromStudent = msg.senderType === 'student';
          const isSystemMessage = msg.senderType === 'system';
          
          if (isSystemMessage) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-gray-100 text-gray-600 text-sm px-3 py-2 rounded-full">
                  {msg.content}
                </div>
              </div>
            );
          }
          
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                isFromStudent ? "justify-start" : "justify-end"
              )}
            >
              {isFromStudent && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-lg",
                isFromStudent ? "order-2" : "order-1"
              )}>
                <div className={cn(
                  "rounded-lg px-4 py-2",
                  isFromStudent 
                    ? "bg-gray-100 text-gray-900" 
                    : "bg-blue-600 text-white"
                )}>
                  <p className="text-sm font-medium mb-1">
                    {msg.senderName}
                  </p>
                  <p>{msg.content}</p>
                </div>
                <p className={cn(
                  "text-xs mt-1",
                  isFromStudent ? "text-left" : "text-right",
                  "text-gray-500"
                )}>
                  {formatDistanceToNow(msg.timestamp, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
              
              {!isFromStudent && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {msg.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {conversation.status !== 'finalizado' && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua resposta..."
                className="min-h-[80px] resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Pressione Enter para enviar, Shift+Enter para nova linha
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {conversation.status === 'finalizado' && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-center text-gray-600">
            Esta conversa foi finalizada. Para reabrir, altere o status acima.
          </p>
        </div>
      )}

      {/* Notas Internas */}
      <div className="p-4 border-t border-gray-200">
        <InternalNotes 
          notes={conversation.internalNotes}
          onSaveNote={(content) => onSaveInternalNote(conversation.id, content, currentUser)}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};
