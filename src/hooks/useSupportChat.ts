
import { useState, useCallback } from "react";

interface Message {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export const useSupportChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [canTransfer, setCanTransfer] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      sender: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "Olá! Como posso ajudá-lo hoje?",
        "Entendo sua dúvida. Deixe-me verificar isso para você.",
        "Para resolver isso, você pode tentar os seguintes passos...",
        "Desculpe, não consegui encontrar uma solução específica. Gostaria de falar com um atendente humano?",
        "Essa é uma ótima pergunta! Vou te explicar como funciona."
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage: Message = {
        sender: 'ai',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Show transfer option after a few messages or if AI can't help
      if (messages.length >= 2 || randomResponse.includes("não consegui")) {
        setCanTransfer(true);
      }
    }, 1500);
  }, [messages.length]);

  const transferToHuman = useCallback(() => {
    const transferMessage: Message = {
      sender: 'ai',
      content: "Transferindo você para um atendente humano. Por favor, aguarde um momento.",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transferMessage]);
    setCanTransfer(false);
    
    // Here would be the logic to actually transfer to human support
    console.log("Transferring to human support...");
  }, []);

  return {
    messages,
    isTyping,
    canTransfer,
    sendMessage,
    transferToHuman
  };
};
