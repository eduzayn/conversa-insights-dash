
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Conversation } from "@/types/atendimento-aluno";
import { Send, Paperclip, Smile, MessageCircle, StickyNote } from "lucide-react";

interface ChatInputProps {
  conversation: Conversation;
  currentUser: any;
  onSendMessage: (conversationId: string, content: string, currentUser: any) => void;
  onSaveInternalNote: (conversationId: string, content: string, currentUser: any) => void;
}

export const ChatInput = ({ 
  conversation, 
  currentUser, 
  onSendMessage, 
  onSaveInternalNote 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"message" | "note">("message");

  const handleSend = () => {
    if (!message.trim()) return;
    
    if (messageType === "message") {
      onSendMessage(conversation.id, message.trim(), currentUser);
    } else {
      onSaveInternalNote(conversation.id, message.trim(), currentUser);
    }
    
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (conversation.status === 'finalizado') {
    return (
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-center text-gray-600">
          Esta conversa foi finalizada. Para reabrir, altere o status acima.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      {/* Toggle de Seleção do Tipo */}
      <div className="mb-3">
        <ToggleGroup
          type="single"
          value={messageType}
          onValueChange={(value) => value && setMessageType(value as "message" | "note")}
          className="justify-start"
        >
          <ToggleGroupItem 
            value="message" 
            className={`flex items-center gap-2 ${
              messageType === "message" 
                ? "bg-blue-100 text-blue-700 border-blue-300" 
                : "bg-gray-50 text-gray-600"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Mensagem para o Aluno
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="note"
            className={`flex items-center gap-2 ${
              messageType === "note" 
                ? "bg-yellow-100 text-yellow-700 border-yellow-300" 
                : "bg-gray-50 text-gray-600"
            }`}
          >
            <StickyNote className="h-4 w-4" />
            Nota Interna
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Indicador do tipo selecionado */}
        <p className="text-xs text-gray-500 mt-1">
          {messageType === "message" 
            ? "Este conteúdo será enviado como mensagem para o aluno" 
            : "Este conteúdo será salvo como nota interna (visível apenas para atendentes)"
          }
        </p>
      </div>

      {/* Campo de Digitação Único */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              messageType === "message" 
                ? "Digite sua mensagem para o aluno..." 
                : "Digite sua nota interna..."
            }
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
          onClick={handleSend}
          disabled={!message.trim()}
          className="self-end"
          variant={messageType === "note" ? "secondary" : "default"}
        >
          {messageType === "message" ? (
            <>
              <Send className="h-4 w-4" />
              Enviar
            </>
          ) : (
            <>
              <StickyNote className="h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
