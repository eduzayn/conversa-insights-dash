
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Conversation } from "@/types/atendimento-aluno";
import { User } from "lucide-react";
import { TransferModal } from "./TransferModal";
import { NotificationSettings } from "./NotificationSettings";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: any;
  availableAttendants: any[];
  onUpdateStatus: (conversationId: string, status: Conversation['status']) => void;
  onTransferConversation: (conversationId: string, fromAttendantId: string, toAttendantId: string, reason?: string) => void;
}

export const ChatHeader = ({ 
  conversation, 
  currentUser, 
  availableAttendants, 
  onUpdateStatus, 
  onTransferConversation 
}: ChatHeaderProps) => {
  const getStatusBadge = (status: Conversation['status']) => {
    switch (status) {
      case 'novo':
        return <Badge variant="destructive">Novo</Badge>;
      case 'em_andamento':
        return <Badge className="bg-orange-100 text-orange-800">Em Andamento</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>;
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {conversation.student.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              {conversation.student.name}
              {conversation.hasNewMessage && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </h2>
            <p className="text-sm text-gray-600">
              {conversation.student.course} • {conversation.student.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationSettings />
          <TransferModal 
            conversation={conversation}
            currentUser={currentUser}
            availableAttendants={availableAttendants}
            onTransfer={onTransferConversation}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusBadge(conversation.status)}
          {conversation.attendant && (
            <span className="text-sm text-gray-600">
              Atendente: {conversation.attendant.name}
            </span>
          )}
        </div>
        
        <Select
          value={conversation.status}
          onValueChange={(value: Conversation['status']) => 
            onUpdateStatus(conversation.id, value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
