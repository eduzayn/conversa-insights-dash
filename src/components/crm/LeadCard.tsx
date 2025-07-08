
import { Lead } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export const LeadCard = ({ lead, isDragging }: LeadCardProps) => {
  const navigate = useNavigate();

  const handleOpenConversation = () => {
    if (lead.conversationId) {
      navigate(`/atendimento-aluno?conversation=${lead.conversationId}`);
    }
  };

  const formatLastInteraction = () => {
    if (!lead.lastInteraction) return 'Sem interação';
    
    try {
      return formatDistanceToNow(lead.lastInteraction, { 
        locale: ptBR, 
        addSuffix: true 
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Card 
      className={`
        mb-3 cursor-grab active:cursor-grabbing transition-all duration-200
        ${isDragging ? 'shadow-lg scale-105 rotate-1' : 'hover:shadow-md'}
        border-l-4 border-l-blue-500
      `}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Nome e Badge do curso */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm leading-tight">
              {lead.name}
            </h4>
            <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
              {lead.course}
            </Badge>
          </div>

          {/* Telefone */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>

          {/* Responsável */}
          {lead.assignedToName && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <User className="h-3 w-3" />
              <span>{lead.assignedToName}</span>
            </div>
          )}

          {/* Última interação */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatLastInteraction()}</span>
          </div>

          {/* Botão de ação */}
          {lead.conversationId && (
            <Button
              onClick={handleOpenConversation}
              size="sm"
              variant="outline"
              className="w-full mt-2 h-7 text-xs"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Ver Conversa
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
