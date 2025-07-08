
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIChatTab } from "./AIChatTab";
import { HumanChatTab } from "./HumanChatTab";
import { Bot, User } from "lucide-react";

interface SupportChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportChatModal = ({ open, onOpenChange }: SupportChatModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed bottom-6 right-6 max-w-md w-96 h-[500px] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Chat de Suporte</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="ai" className="h-full flex flex-col">
          <TabsList className="mx-4 grid w-auto grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              IA
            </TabsTrigger>
            <TabsTrigger value="human" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Humano
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai" className="flex-1 px-4 pb-4">
            <AIChatTab />
          </TabsContent>
          
          <TabsContent value="human" className="flex-1 px-4 pb-4">
            <HumanChatTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
