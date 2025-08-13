
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ConversationList } from "@/components/atendimento-aluno/ConversationList";
import { ChatArea } from "@/components/atendimento-aluno/AtendimentoChatArea";
import { AtendimentoFilters } from "@/components/atendimento-aluno/AtendimentoFilters";
import { useAtendimentoAluno } from "@/hooks/useAtendimentoAluno";
import { Conversation } from "@/types/atendimento-aluno";

const AtendimentoAluno = () => {
  const { user, loading } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [filters, setFilters] = useState({
    curso: '',
    status: '',
    atendente: ''
  });

  const { 
    conversations, 
    availableAttendants,
    isLoading,
    hasMoreConversations,
    isLoadingConversations,
    loadMoreConversations,
    hasMoreMessages,
    isLoadingMessages,
    loadMoreMessages,
    initializeConversationPagination,
    sendMessage, 
    updateStatus,
    transferConversation,
    saveInternalNote
  } = useAtendimentoAluno(filters);

  // Inicializar paginação de mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (activeConversation) {
      initializeConversationPagination(activeConversation.id);
    }
  }, [activeConversation, initializeConversationPagination]);

  const handleLoadMoreMessages = () => {
    if (activeConversation) {
      loadMoreMessages(activeConversation.id);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation);
    // Em mobile, esconder a lista de conversas quando uma conversa é selecionada
    if (window.innerWidth < 768) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setActiveConversation(null);
  };

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col p-2 md:p-4">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Atendimento ao Aluno</h1>
            <AtendimentoFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          
          <div className="flex-1 flex gap-2 md:gap-4 min-h-0">
            {/* Lista de Conversas - Responsiva */}
            <div className={`
              ${showConversationList ? 'flex' : 'hidden'} 
              md:flex w-full md:w-80 flex-shrink-0
            `}>
              <ConversationList 
                conversations={conversations}
                activeConversation={activeConversation}
                onConversationSelect={handleConversationSelect}
                isLoading={isLoading}
                hasMoreConversations={hasMoreConversations}
                isLoadingConversations={isLoadingConversations}
                onLoadMore={loadMoreConversations}
              />
            </div>
            
            {/* Área de Chat - Responsiva */}
            <div className={`
              ${!showConversationList ? 'flex' : 'hidden'} 
              md:flex flex-1 flex-col min-w-0
            `}>
              <ChatArea 
                conversation={activeConversation}
                currentUser={user}
                availableAttendants={availableAttendants}
                hasMoreMessages={activeConversation ? hasMoreMessages[activeConversation.id] || false : false}
                isLoadingMessages={activeConversation ? isLoadingMessages[activeConversation.id] || false : false}
                onSendMessage={sendMessage}
                onUpdateStatus={updateStatus}
                onTransferConversation={transferConversation}
                onSaveInternalNote={saveInternalNote}
                onLoadMoreMessages={handleLoadMoreMessages}
                onBackToList={handleBackToList}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoAluno;
