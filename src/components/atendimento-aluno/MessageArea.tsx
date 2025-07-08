
import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/atendimento-aluno";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Mic, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageAreaProps {
  conversation: Conversation;
}

export const MessageArea = ({ conversation }: MessageAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

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
              {/* Aqui seria renderizado o player de áudio real */}
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

  return (
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
                {renderMessageContent(msg)}
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
  );
};
