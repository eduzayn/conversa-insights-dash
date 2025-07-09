
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Atendimento } from "@/types/atendimento";
import { useEffect, useRef } from "react";

interface AtendimentosTableProps {
  atendimentos: Atendimento[];
  isLoading: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onResultadoChange: (id: string, newResultado: string) => void;
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
  filters,
  // Scroll infinito
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}: AtendimentosTableProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      'Concluído': 'bg-green-100 text-green-800',
      'Em andamento': 'bg-yellow-100 text-yellow-800',
      'Pendente': 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || variants['Pendente'];
  };

  const getResultadoBadge = (resultado: string) => {
    const variants = {
      'venda_ganha': 'bg-green-100 text-green-800',
      'venda_perdida': 'bg-red-100 text-red-800',
      'aluno_satisfeito': 'bg-blue-100 text-blue-800',
      'sem_solucao': 'bg-orange-100 text-orange-800'
    };
    return variants[resultado as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getResultadoLabel = (resultado: string) => {
    const labels = {
      'venda_ganha': 'Venda Ganha',
      'venda_perdida': 'Venda Perdida',
      'aluno_satisfeito': 'Aluno Satisfeito',
      'sem_solucao': 'Sem Solução'
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hora</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Atendente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Duração</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Resultado CRM</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.lead}</td>
                    <td className="py-3 px-4 text-gray-600">{item.hora}</td>
                    <td className="py-3 px-4 text-gray-600">{item.atendente}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {item.equipe}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.duracao}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(item.status)}>
                        {item.status}
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
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Select
                          value={item.status}
                          onValueChange={(value) => onStatusChange(String(item.id), value)}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em andamento">Em andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={item.resultado || ""}
                          onValueChange={(value) => onResultadoChange(String(item.id), value)}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Classificar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="venda_ganha">Venda Ganha</SelectItem>
                            <SelectItem value="venda_perdida">Venda Perdida</SelectItem>
                            <SelectItem value="aluno_satisfeito">Aluno Satisfeito</SelectItem>
                            <SelectItem value="sem_solucao">Sem Solução</SelectItem>
                          </SelectContent>
                        </Select>
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
