
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Atendimento } from "@/types/atendimento";

interface AtendimentosTableProps {
  atendimentos: Atendimento[];
  isLoading: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  filters: any;
}

export const AtendimentosTable = ({ 
  atendimentos, 
  isLoading, 
  isUpdatingStatus, 
  onStatusChange, 
  filters 
}: AtendimentosTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      'Concluído': 'bg-green-100 text-green-800',
      'Em andamento': 'bg-yellow-100 text-yellow-800',
      'Pendente': 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || variants['Pendente'];
  };

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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
