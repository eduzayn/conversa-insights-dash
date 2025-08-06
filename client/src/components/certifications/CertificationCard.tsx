/**
 * Componente que representa cada card de certificação na listagem
 * 
 * Renderiza todas as informações de uma certificação individual
 * incluindo badges de status, botões de ação e detalhes acadêmicos
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Certification } from '@shared/schema';

// Constantes de cores e labels (mantidas iguais ao arquivo original)
const STATUS_COLORS = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'em_andamento': 'bg-blue-100 text-blue-800',
  'concluido': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
  'em_atraso': 'bg-orange-100 text-orange-800'
};

const STATUS_LABELS = {
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'concluido': 'Concluído',
  'cancelado': 'Cancelado',
  'em_atraso': 'Em Atraso'
};

const ACADEMIC_STATUS_LABELS = {
  'nao_possui': 'Não Possui',
  'aprovado': 'Aprovado',
  'reprovado': 'Reprovado',
  'em_correcao': 'Em Correção'
};

const ACADEMIC_STATUS_COLORS = {
  'nao_possui': 'bg-green-50 text-green-700',
  'aprovado': 'bg-green-200 text-green-900',
  'reprovado': 'bg-red-100 text-red-800',
  'em_correcao': 'bg-yellow-100 text-yellow-800'
};

const DOCUMENTATION_STATUS_COLORS = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'aprovada': 'bg-green-100 text-green-800',
  'reprovada': 'bg-red-100 text-red-800'
};

const FINANCIAL_STATUS_COLORS = {
  'em_dia': 'bg-blue-100 text-blue-800',
  'quitado': 'bg-green-100 text-green-800',
  'inadimplente': 'bg-red-100 text-red-800',
  'expirado': 'bg-gray-100 text-gray-800'
};

const PLATFORM_STATUS_COLORS = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'aprovada': 'bg-green-100 text-green-800'
};

const DOCUMENTATION_STATUS_LABELS = {
  'pendente': 'Pendente',
  'aprovada': 'Aprovada',
  'reprovada': 'Reprovada'
};

const FINANCIAL_STATUS_LABELS = {
  'em_dia': 'Pendente',
  'quitado': 'Quitado',
  'inadimplente': 'Inadimplente',
  'expirado': 'Expirado'
};

const PLATFORM_STATUS_LABELS = {
  'pendente': 'Pendente',
  'aprovada': 'Aprovada'
};

interface CertificationCardProps {
  certification: Certification;
  isDuplicate: boolean;
  onEdit: (certification: Certification) => void;
  onDelete: (id: number) => void;
  onDuplicate: (certification: Certification) => void;
}

export const CertificationCard = ({
  certification,
  isDuplicate,
  onEdit,
  onDelete,
  onDuplicate
}: CertificationCardProps) => {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isDuplicate ? 'border-orange-300 bg-orange-50' : ''}`}>
      <CardContent className="p-6">
        {/* Alerta de duplicata */}
        {isDuplicate && (
          <div className="mb-3 flex items-center gap-2 text-orange-700 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Possível duplicata detectada
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1">
            {/* Coluna 1: Informações básicas do aluno */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-semibold text-lg">{certification.aluno}</div>
                <Badge className={STATUS_COLORS[certification.status as keyof typeof STATUS_COLORS]}>
                  {STATUS_LABELS[certification.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">CPF: {certification.cpf}</div>
              <div className="text-sm text-gray-600">Curso: {certification.curso}</div>
              {certification.cargaHoraria && (
                <div className="text-sm text-gray-600">Carga Horária: {certification.cargaHoraria}h</div>
              )}
              {certification.telefone && (
                <div className="text-sm text-gray-600">Telefone: {certification.telefone}</div>
              )}
            </div>
            
            {/* Coluna 2: Status de documentação */}
            <div>
              <div className="text-sm font-medium text-gray-700">Documentação</div>
              <Badge variant="outline" className={`text-xs ${DOCUMENTATION_STATUS_COLORS[certification.documentacao as keyof typeof DOCUMENTATION_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                {DOCUMENTATION_STATUS_LABELS[certification.documentacao as keyof typeof DOCUMENTATION_STATUS_LABELS] || certification.documentacao || 'Não informado'}
              </Badge>
            </div>
            
            {/* Coluna 3: Status de plataforma e financeiro */}
            <div>
              <div className="text-sm font-medium text-gray-700">Atividades Plataforma</div>
              <Badge variant="outline" className={`text-xs ${PLATFORM_STATUS_COLORS[certification.plataforma as keyof typeof PLATFORM_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                {PLATFORM_STATUS_LABELS[certification.plataforma as keyof typeof PLATFORM_STATUS_LABELS] || certification.plataforma || 'Não informado'}
              </Badge>
              <div className="text-sm font-medium text-gray-700 mt-2">Financeiro</div>
              <Badge variant="outline" className={`text-xs ${FINANCIAL_STATUS_COLORS[certification.financeiro as keyof typeof FINANCIAL_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                {FINANCIAL_STATUS_LABELS[certification.financeiro as keyof typeof FINANCIAL_STATUS_LABELS] || certification.financeiro || 'Não informado'}
              </Badge>
            </div>
            
            {/* Coluna 4: Campos acadêmicos específicos */}
            <div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">TCC:</span>
                  <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.tcc as keyof typeof ACADEMIC_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                    {ACADEMIC_STATUS_LABELS[certification.tcc as keyof typeof ACADEMIC_STATUS_LABELS] || 'Não Possui'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Práticas:</span>
                  <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.praticasPedagogicas as keyof typeof ACADEMIC_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                    {ACADEMIC_STATUS_LABELS[certification.praticasPedagogicas as keyof typeof ACADEMIC_STATUS_LABELS] || 'Não Possui'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Estágio:</span>
                  <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.estagio as keyof typeof ACADEMIC_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                    {ACADEMIC_STATUS_LABELS[certification.estagio as keyof typeof ACADEMIC_STATUS_LABELS] || 'Não Possui'}
                  </Badge>
                </div>
                
                {certification.tutoria && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Tutoria:</span>
                    <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.tutoria as keyof typeof ACADEMIC_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                      {ACADEMIC_STATUS_LABELS[certification.tutoria as keyof typeof ACADEMIC_STATUS_LABELS] || certification.tutoria}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Observações */}
              {certification.observacao && (
                <div className="text-sm text-gray-600 mt-2">
                  <strong>Obs:</strong> {certification.observacao.length > 50 ? certification.observacao.substring(0, 50) + '...' : certification.observacao}
                </div>
              )}
            </div>
            
            {/* Coluna 5: Datas */}
            <div>
              <div className="text-sm font-medium text-gray-700">Data Inicio Certificação</div>
              <div className="text-sm">{formatDate(certification.inicioCertificacao)}</div>
              <div className="text-sm font-medium text-gray-700 mt-2">Data Entrega Certificação</div>
              <div className="text-sm">{formatDate(certification.dataEntrega)}</div>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(certification)}
              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
              title="Duplicar certificação"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(certification)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(certification.id)}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};