
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Conversation } from "@/types/atendimento-aluno";
import { Send, Paperclip, Smile } from "lucide-react";

interface ChatInputProps {
  conversation: Conversation;
  currentUser: any;
  onSendMessage: (conversationId: string, content: string, currentUser: any) => void;
}

export const ChatInput = ({ conversation, currentUser, onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    onSendMessage(conversation.id, message.trim(), currentUser);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
  );
};
