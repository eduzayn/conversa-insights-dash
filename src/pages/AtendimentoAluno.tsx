import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ConversationList } from "@/components/atendimento-aluno/ConversationList";
import { ChatArea } from "@/components/atendimento-aluno/ChatArea";
import { AtendimentoFilters } from "@/components/atendimento-aluno/AtendimentoFilters";
import { useAtendimentoAluno } from "@/hooks/useAtendimentoAluno";
import { Conversation } from "@/types/atendimento-aluno";

const AtendimentoAluno = () => {
  const { user, loading } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [filters, setFilters] = useState({
    curso: '',
    status: '',
    atendente: ''
  });

  const { 
    conversations, 
    availableAttendants,
    isLoading, 
    sendMessage, 
    updateStatus,
    transferConversation,
    saveInternalNote
  } = useAtendimentoAluno(filters);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Atendimento ao Aluno</h1>
            <AtendimentoFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="w-80 flex-shrink-0">
              <ConversationList 
                conversations={conversations}
                activeConversation={activeConversation}
                onConversationSelect={setActiveConversation}
                isLoading={isLoading}
              />
            </div>
            
            <div className="flex-1 flex flex-col">
              <ChatArea 
                conversation={activeConversation}
                currentUser={user}
                availableAttendants={availableAttendants}
                onSendMessage={sendMessage}
                onUpdateStatus={updateStatus}
                onTransferConversation={transferConversation}
                onSaveInternalNote={saveInternalNote}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoAluno;
