
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Conversation, Attendant } from "@/types/atendimento-aluno";
import { ChatHeader } from "./ChatHeader";
import { MessageArea } from "./MessageArea";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";

interface ChatAreaProps {
  conversation: Conversation | null;
  currentUser: any;
  availableAttendants: Attendant[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  onSendMessage: (conversationId: string, content: string, currentUser: any) => void;
  onUpdateStatus: (conversationId: string, status: Conversation['status']) => void;
  onTransferConversation: (conversationId: string, fromAttendantId: string, toAttendantId: string, reason?: string) => void;
  onSaveInternalNote: (conversationId: string, content: string, currentUser: any) => void;
  onLoadMoreMessages: () => void;
  onBackToList?: () => void;
}

export const ChatArea = ({ 
  conversation, 
  currentUser, 
  availableAttendants,
  hasMoreMessages,
  isLoadingMessages,
  onSendMessage, 
  onUpdateStatus,
  onTransferConversation,
  onSaveInternalNote,
  onLoadMoreMessages,
  onBackToList
}: ChatAreaProps) => {
  if (!conversation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-full flex items-center justify-center p-4">
        <div className="text-center">
          <MessageCircle className="h-12 md:h-16 w-12 md:w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Selecione uma conversa
          </h2>
          <p className="text-sm md:text-base text-gray-600 text-center">
            Escolha uma conversa da lista para começar a atender o aluno
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
      {/* Botão de voltar para mobile */}
      {onBackToList && (
        <div className="md:hidden p-2 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToList}
            className="flex items-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à lista</span>
          </Button>
        </div>
      )}

      <ChatHeader 
        conversation={conversation}
        currentUser={currentUser}
        availableAttendants={availableAttendants}
        onUpdateStatus={onUpdateStatus}
        onTransferConversation={onTransferConversation}
      />

      <MessageArea 
        conversation={conversation}
        hasMoreMessages={hasMoreMessages}
        isLoadingMessages={isLoadingMessages}
        onLoadMoreMessages={onLoadMoreMessages}
      />

      <ChatInput 
        conversation={conversation}
        currentUser={currentUser}
        onSendMessage={onSendMessage}
        onSaveInternalNote={onSaveInternalNote}
      />
    </div>
  );
};
