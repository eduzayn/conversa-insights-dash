
import { Lead } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, MessageCircle, Clock, User, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface CrmListViewProps {
  leads: Lead[];
}

export const CrmListView = ({ leads }: CrmListViewProps) => {
  const navigate = useNavigate();

  const handleOpenConversation = (lead: Lead) => {
    if (lead.conversationId) {
      navigate(`/atendimento-aluno?conversation=${lead.conversationId}`);
    }
  };

  const formatLastInteraction = (date?: Date) => {
    if (!date) return 'Sem interação';
    
    try {
      return formatDistanceToNow(date, { 
        locale: ptBR, 
        addSuffix: true 
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'novo-contato': 'bg-yellow-100 text-yellow-800',
      'em-atendimento': 'bg-blue-100 text-blue-800',
      'aguardando-resposta': 'bg-orange-100 text-orange-800',
      'fechou-venda': 'bg-green-100 text-green-800',
      'perdeu': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'novo-contato': 'Novo Contato',
      'em-atendimento': 'Em Atendimento',
      'aguardando-resposta': 'Aguardando Resposta',
      'fechou-venda': 'Fechou Venda',
      'perdeu': 'Perdeu'
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium">{lead.name}</div>
                    {lead.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Mail className="h-3 w-3" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{lead.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {lead.course}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.assignedToName && (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        <span>{lead.assignedToName}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{formatLastInteraction(lead.lastInteraction)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.conversationId && (
                      <Button
                        onClick={() => handleOpenConversation(lead)}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Ver Conversa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
