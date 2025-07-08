
import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/atendimento-aluno";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageAreaProps {
  conversation: Conversation;
}

export const MessageArea = ({ conversation }: MessageAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

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
  );
};
