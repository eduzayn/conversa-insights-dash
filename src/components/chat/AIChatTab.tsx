
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Settings } from "lucide-react";
import { useSupportChat } from "@/hooks/useSupportChat";
import { AIConfigPanel } from "./AIConfigPanel";

export const AIChatTab = () => {
  const [message, setMessage] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    transferToHuman,
    canTransfer 
  } = useSupportChat();

  const handleSend = async () => {
    if (!message.trim()) return;
    
    await sendMessage(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showConfig) {
    return <AIConfigPanel onBack={() => setShowConfig(false)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Assistente IA</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfig(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">
              Olá! Como posso ajudá-lo hoje?
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0">
                  {msg.sender === 'ai' ? (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-lg text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-3 w-3 text-blue-600" />
              </div>
              <div className="bg-gray-100 text-gray-900 p-2 rounded-lg text-sm">
                IA está digitando...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {canTransfer && (
        <Button
          variant="outline"
          size="sm"
          onClick={transferToHuman}
          className="mb-2 text-sm"
        >
          Falar com um humano
        </Button>
      )}

      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="flex-1"
        />
        <Button onClick={handleSend} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
