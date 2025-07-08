
import { useRef, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/atendimento-aluno";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Mic, FileText, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { groupMessagesByDate } from "@/utils/messageGrouping";

interface MessageAreaProps {
  conversation: Conversation;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  onLoadMoreMessages: () => void;
}

export const MessageArea = ({ 
  conversation, 
  hasMoreMessages, 
  isLoadingMessages, 
  onLoadMoreMessages 
}: MessageAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousScrollHeight = useRef<number>(0);

  const { containerRef } = useInfiniteScroll(onLoadMoreMessages, {
    hasNextPage: hasMoreMessages,
    isLoading: isLoadingMessages,
    threshold: 100
  });

  // Scroll para o final apenas quando há novas mensagens (não ao carregar mensagens antigas)
  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages, shouldScrollToBottom]);

  // Preservar posição do scroll ao carregar mensagens antigas
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoadingMessages) return;

    const currentScrollHeight = container.scrollHeight;
    if (previousScrollHeight.current > 0) {
      const heightDifference = currentScrollHeight - previousScrollHeight.current;
      container.scrollTop = heightDifference;
      setShouldScrollToBottom(false);
    }
    previousScrollHeight.current = currentScrollHeight;
  }, [isLoadingMessages]);

  // Detectar se o usuário está no final da conversa para decidir se deve fazer scroll automático
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldScrollToBottom(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const renderMessageContent = (msg: any) => {
    // Detectar se é uma mensagem de áudio
    if (msg.content.includes('Enviou um áudio')) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-w-sm">
            <Mic className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Mensagem de áudio
              </p>
              <p className="text-xs text-gray-500">{msg.content}</p>
              {/* Player de áudio real */}
              <div className="mt-2 bg-gray-200 rounded-full h-2 relative">
                <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Detectar se é um arquivo
    if (msg.content.includes('Enviou') && (msg.content.includes('arquivo') || msg.content.includes('imagem'))) {
      const isImage = msg.content.includes('imagem');
      return (
        <div className="space-y-2">
          <p>{msg.content}</p>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-w-sm">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {isImage ? 'Imagem' : 'Documento'}
              </p>
              <p className="text-xs text-gray-500">Arquivo enviado</p>
            </div>
            <Download className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      );
    }

    // Mensagem de texto normal
    return <p>{msg.content}</p>;
  };

  const messageGroups = groupMessagesByDate(conversation.messages);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {/* Loading indicator para mensagens antigas */}
      {isLoadingMessages && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-600">Carregando mensagens anteriores...</span>
        </div>
      )}

      {!hasMoreMessages && conversation.messages.length > 0 && (
        <div className="flex justify-center py-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Início da conversa
          </span>
        </div>
      )}

      {messageGroups.map((group, groupIndex) => (
        <div key={`${group.date.toISOString()}-${groupIndex}`} className="space-y-4">
          {/* Separador de data */}
          <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full font-medium">
              — {group.dateLabel} —
            </div>
          </div>

          {/* Mensagens do grupo */}
          {group.messages.map((msg) => {
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
                    {renderMessageContent(msg)}
                  </div>
                  <p className={cn(
                    "text-xs mt-1",
                    isFromStudent ? "text-left" : "text-right",
                    "text-gray-500"
                  )}>
                    {format(msg.timestamp, 'HH:mm')}
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
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
