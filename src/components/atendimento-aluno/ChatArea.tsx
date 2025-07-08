
import { MessageCircle } from "lucide-react";
import { Conversation, Attendant } from "@/types/atendimento-aluno";
import { ChatHeader } from "./ChatHeader";
import { MessageArea } from "./MessageArea";
import { ChatInput } from "./ChatInput";
import { InternalNotes } from "./InternalNotes";

interface ChatAreaProps {
  conversation: Conversation | null;
  currentUser: any;
  availableAttendants: Attendant[];
  onSendMessage: (conversationId: string, content: string, currentUser: any) => void;
  onUpdateStatus: (conversationId: string, status: Conversation['status']) => void;
  onTransferConversation: (conversationId: string, fromAttendantId: string, toAttendantId: string, reason?: string) => void;
  onSaveInternalNote: (conversationId: string, content: string, currentUser: any) => void;
}

export const ChatArea = ({ 
  conversation, 
  currentUser, 
  availableAttendants,
  onSendMessage, 
  onUpdateStatus,
  onTransferConversation,
  onSaveInternalNote
}: ChatAreaProps) => {
  if (!conversation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Selecione uma conversa
          </h2>
          <p className="text-gray-600">
            Escolha uma conversa da lista para começar a atender o aluno
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
      <ChatHeader 
        conversation={conversation}
        currentUser={currentUser}
        availableAttendants={availableAttendants}
        onUpdateStatus={onUpdateStatus}
        onTransferConversation={onTransferConversation}
      />

      <MessageArea conversation={conversation} />

      <ChatInput 
        conversation={conversation}
        currentUser={currentUser}
        onSendMessage={onSendMessage}
      />

      <div className="p-4 border-t border-gray-200">
        <InternalNotes 
          notes={conversation.internalNotes}
          onSaveNote={(content) => onSaveInternalNote(conversation.id, content, currentUser)}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};
