
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Attendant, Conversation } from "@/types/atendimento-aluno";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface TransferModalProps {
  conversation: Conversation;
  currentUser: any;
  availableAttendants: Attendant[];
  onTransfer: (conversationId: string, fromAttendantId: string, toAttendantId: string, reason?: string) => void;
}

export const TransferModal = ({ 
  conversation, 
  currentUser, 
  availableAttendants, 
  onTransfer 
}: TransferModalProps) => {
  const [selectedAttendant, setSelectedAttendant] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const handleTransfer = () => {
    if (!selectedAttendant) {
      toast.error("Selecione um atendente para transferir");
      return;
    }

    onTransfer(conversation.id, currentUser.id, selectedAttendant, reason);
    setSelectedAttendant("");
    setReason("");
    setOpen(false);
  };

  // Filtrar atendentes disponíveis (excluir o atual)
  const filteredAttendants = availableAttendants.filter(att => att.id !== currentUser.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transferir
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transferir Atendimento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Aluno:</p>
            <p className="font-medium">{conversation.student.name}</p>
            <p className="text-sm text-gray-500">{conversation.student.course}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Transferir para:</Label>
            <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um atendente" />
              </SelectTrigger>
              <SelectContent>
                {filteredAttendants.map((attendant) => (
                  <SelectItem key={attendant.id} value={attendant.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {attendant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{attendant.name}</span>
                      {attendant.isOnline && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Motivo da transferência (opcional):</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Especialização necessária, carga de trabalho..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleTransfer} className="flex-1">
              Confirmar Transferência
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
