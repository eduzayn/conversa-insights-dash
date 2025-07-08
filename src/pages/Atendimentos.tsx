
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Search, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Atendimentos = () => {
  const { user, loading } = useAuth();
  const {
    atendimentos,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    updateStatus,
    isUpdatingStatus,
    refetch,
    exportToCSV
  } = useAtendimentos();

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

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus(id, newStatus as any);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Concluído': 'bg-green-100 text-green-800',
      'Em andamento': 'bg-yellow-100 text-yellow-800',
      'Pendente': 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || variants['Pendente'];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Atendimentos</h1>
                <p className="text-gray-600">
                  Visualize todos os atendimentos {isLoading ? '(Carregando...)' : `(${atendimentos.length} atendimentos)`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={exportToCSV}
                  disabled={atendimentos.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>Erro ao carregar dados. Usando dados locais temporariamente.</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Filtros</CardTitle>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Buscar por nome..." 
                      className="pl-9"
                      value={filters.search || ''}
                      onChange={(e) => updateFilters({ search: e.target.value })}
                    />
                  </div>
                  <Select value={filters.periodo || ''} onValueChange={(value) => updateFilters({ periodo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="esta-semana">Esta Semana</SelectItem>
                      <SelectItem value="semana-passada">Semana Passada</SelectItem>
                      <SelectItem value="este-mes">Este Mês</SelectItem>
                      <SelectItem value="mes-passado">Mês Passado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.atendente || ''} onValueChange={(value) => updateFilters({ atendente: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="ana">Ana Santos</SelectItem>
                      <SelectItem value="carlos">Carlos Lima</SelectItem>
                      <SelectItem value="bruna">Bruna Reis</SelectItem>
                      <SelectItem value="diego">Diego Alves</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.equipe || ''} onValueChange={(value) => updateFilters({ equipe: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.status || ''} onValueChange={(value) => updateFilters({ status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="andamento">Em andamento</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
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
                                onValueChange={(value) => handleStatusChange(item.id, value)}
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Atendimentos;
