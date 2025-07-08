
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

export const HumanChatTab = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Atendimento Humano</h3>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Aguardando atendente
        </Badge>
      </div>

      <ScrollArea className="flex-1 mb-4">
        <div className="text-center text-gray-500 text-sm py-8">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Você foi transferido para nossa equipe.</p>
          <p>Um atendente estará com você em breve.</p>
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Aguardando conexão..."
          disabled
          className="flex-1"
        />
        <Button disabled size="sm">
          Enviar
        </Button>
      </div>
    </div>
  );
};
