
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/atendimento-aluno";
import { cn } from "@/lib/utils";
import { MessageCircle, Loader2 } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  isLoading: boolean;
  hasMoreConversations: boolean;
  isLoadingConversations: boolean;
  onLoadMore: () => void;
}

export const ConversationList = ({ 
  conversations, 
  activeConversation, 
  onConversationSelect,
  isLoading,
  hasMoreConversations,
  isLoadingConversations,
  onLoadMore
}: ConversationListProps) => {
  const { containerRef } = useInfiniteScroll(onLoadMore, {
    hasNextPage: hasMoreConversations,
    isLoading: isLoadingConversations,
    threshold: 200
  });

  const getStatusBadge = (status: Conversation['status']) => {
    switch (status) {
      case 'novo':
        return <Badge variant="destructive" className="text-xs">Novo</Badge>;
      case 'em_andamento':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Em Andamento</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-800 text-xs">Finalizado</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col items-center justify-center p-4 md:p-6">
        <MessageCircle className="h-10 md:h-12 w-10 md:w-12 text-gray-400 mb-4" />
        <p className="text-sm md:text-base text-gray-500 text-center">Nenhuma conversa encontrada</p>
        <p className="text-xs md:text-sm text-gray-400 text-center mt-1">
          Ajuste os filtros para ver outras conversas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
      <div className="p-3 md:p-4 border-b border-gray-200">
        <h2 className="text-sm md:text-base font-semibold text-gray-900">
          Conversas ({conversations.length})
        </h2>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto"
      >
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation)}
            className={cn(
              "p-3 md:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors min-h-[80px] active:bg-gray-100",
              activeConversation?.id === conversation.id && "bg-blue-50 border-blue-200"
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {conversation.student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">
                    {conversation.student.name}
                  </h3>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center flex-shrink-0 ml-2">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs md:text-sm text-gray-600 mb-2 truncate">
                  {conversation.student.course}
                </p>
                
                <div className="flex items-center justify-between mb-2 gap-2">
                  {getStatusBadge(conversation.status)}
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(conversation.updatedAt, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
                
                {conversation.lastMessage && (
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {conversation.lastMessage.senderType === 'student' ? '👤 ' : '🎧 '}
                    {conversation.lastMessage.content}
                  </p>
                )}
                
                {conversation.attendant && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    Atendente: {conversation.attendant.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator para scroll infinito */}
        {isLoadingConversations && (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Carregando mais conversas...</span>
          </div>
        )}
        
        {!hasMoreConversations && conversations.length > 0 && (
          <div className="p-4 text-center">
            <span className="text-xs text-gray-400">Todas as conversas foram carregadas</span>
          </div>
        )}
      </div>
    </div>
  );
};
