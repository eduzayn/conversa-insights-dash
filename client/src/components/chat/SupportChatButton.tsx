
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportChatModal } from "./SupportChatModal";

export const SupportChatButton = () => {
  // Temporariamente oculto - remover comentário para reativar
  return null;
  
  /*
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0"
        title="Chat de Suporte"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      
      <SupportChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
  */
};
