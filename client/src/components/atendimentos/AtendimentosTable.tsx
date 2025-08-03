
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { Atendimento } from "@/types/atendimento";
import { useEffect, useRef } from "react";

// Função para formatar data de entrada de atendimento
const formatDataEntrada = (atendimento: Atendimento) => {
  // Combinar data e hora existentes do atendimento
  if (atendimento.data && atendimento.hora) {
    // Formato: "23/07/2025 18:04"
    return `${atendimento.data} ${atendimento.hora}`;
  }
  
  // Fallback: só hora se não tiver data
  return atendimento.hora || 'Não informado';
};

interface AtendimentosTableProps {
  atendimentos: Atendimento[];
  isLoading: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onResultadoChange: (id: string, newResultado: string) => void;
  onEditAtendimento?: (atendimento: Atendimento) => void;
  onDeleteAtendimento?: (id: string) => void;
  onDuplicateAtendimento?: (atendimento: Atendimento) => void;
  filters: any;
  // Scroll infinito
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export const AtendimentosTable = ({ 
  atendimentos, 
  isLoading, 
  isUpdatingStatus, 
  onStatusChange, 
  onResultadoChange,
  onEditAtendimento,
  onDeleteAtendimento,
  onDuplicateAtendimento,
  filters,
  // Scroll infinito
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}: AtendimentosTableProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      'Concluído': { bg: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
      'Em andamento': { bg: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
      'Pendente': { bg: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' }
    };
    return variants[status as keyof typeof variants] || variants['Pendente'];
  };

  const getResultadoBadge = (resultado: string) => {
    const variants = {
      'venda_ganha': 'bg-green-100 text-green-800',
      'venda_perdida': 'bg-red-100 text-red-800',
      'aluno_satisfeito': 'bg-blue-100 text-blue-800',
      'sem_solucao': 'bg-orange-100 text-orange-800',
      'resolvido': 'bg-purple-100 text-purple-800'
    };
    return variants[resultado as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getResultadoLabel = (resultado: string) => {
    const labels = {
      'venda_ganha': 'Venda Ganha',
      'venda_perdida': 'Venda Perdida',
      'aluno_satisfeito': 'Aluno Satisfeito',
      'sem_solucao': 'Sem Solução',
      'resolvido': 'Resolvido'
    };
    return labels[resultado as keyof typeof labels] || 'Não classificado';
  };

  // Intersection Observer para detectar quando o usuário chegou ao final da lista
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage?.();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '20px'
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Atendimentos {filters.periodo ? `- ${filters.periodo}` : 'de Hoje'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando atendimentos...</span>
          </div>
        ) : atendimentos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum atendimento encontrado com os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nome do Lead</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Data de Entrada</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Atendente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Assunto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Duração</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Resultado CRM</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Observações</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.lead}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDataEntrada(item)}</td>
                    <td className="py-3 px-4 text-gray-600">{item.atendente}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {item.equipe}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.assunto ? (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                          {item.assunto}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 italic">Não informado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.duracao}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(item.status).bg}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusBadge(item.status).dot}`}></div>
                          {item.status}
                        </div>
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {item.resultado ? (
                        <Badge className={getResultadoBadge(item.resultado)}>
                          {getResultadoLabel(item.resultado)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Não classificado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs">
                      {item.observacoes ? (
                        <span 
                          className="text-sm text-gray-700 block truncate" 
                          title={item.observacoes}
                        >
                          {item.observacoes}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Sem observações</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {onEditAtendimento && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditAtendimento(item)}
                            className="h-8 w-8 p-0"
                            title="Editar atendimento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDuplicateAtendimento && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDuplicateAtendimento(item)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Duplicar atendimento com data atual"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteAtendimento && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeleteAtendimento(String(item.id))}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir atendimento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Indicador de carregamento para scroll infinito */}
            {hasNextPage && (
              <div 
                ref={loadMoreRef}
                className="flex justify-center items-center py-6 border-t mt-4"
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-gray-600">Carregando mais atendimentos...</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => fetchNextPage?.()}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    Carregar mais atendimentos
                  </Button>
                )}
              </div>
            )}
            
            {/* Indicador de fim da lista */}
            {!hasNextPage && atendimentos.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm border-t mt-4">
                Todos os atendimentos foram carregados
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
