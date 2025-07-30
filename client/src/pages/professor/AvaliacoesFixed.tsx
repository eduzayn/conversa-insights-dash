import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Users, 
  Clock, 
  BarChart3,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Edit,
  Trash2
} from "lucide-react";

export default function Avaliacoes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("todas");
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Buscar avaliações da API
  const { data: avaliacoes = [], isLoading: isLoadingAvaliacoes } = useQuery({
    queryKey: ['/api/professor/evaluations'],
  });

  // Buscar disciplinas para filtros
  const { data: disciplinas = [], isLoading: isLoadingDisciplinas } = useQuery({
    queryKey: ['/api/professor/subjects'],
  });

  // Filtros e paginação
  const filteredAvaliacoes = useMemo(() => {
    let filtered = (avaliacoes as any[]).filter((avaliacao: any) => {
      const matchesSearch = avaliacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           avaliacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDisciplina = selectedDisciplina === "todas" || 
                               avaliacao.subjectId.toString() === selectedDisciplina;
      const matchesTipo = selectedTipo === "todos" || avaliacao.tipo === selectedTipo;
      const matchesStatus = selectedStatus === "todos" || avaliacao.status === selectedStatus;
      
      return matchesSearch && matchesDisciplina && matchesTipo && matchesStatus;
    });

    return filtered;
  }, [avaliacoes, searchTerm, selectedDisciplina, selectedTipo, selectedStatus]);

  // Paginação
  const totalPages = Math.ceil(filteredAvaliacoes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAvaliacoes = filteredAvaliacoes.slice(startIndex, endIndex);

  // Funções de filtro
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDisciplina("todas");
    setSelectedTipo("todos");
    setSelectedStatus("todos");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedDisciplina !== "todas" || 
                          selectedTipo !== "todos" || selectedStatus !== "todos";

  // Função para obter nome da disciplina
  const getDisciplinaNome = (subjectId: number) => {
    const disciplina = (disciplinas as any[]).find((d: any) => d.id === subjectId);
    return disciplina ? disciplina.nome : "Disciplina não encontrada";
  };

  // Funções de ação
  const handleEditAvaliacao = (id: number) => {
    navigate(`/professor/avaliacoes/${id}/editar`);
  };

  const handleViewResults = (id: number) => {
    navigate(`/professor/avaliacoes/${id}/resultados`);
  };

  const handleDeleteAvaliacao = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
      try {
        await apiRequest(`/api/professor/evaluations/${id}`, {
          method: 'DELETE'
        });
        queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
        toast({
          title: "Sucesso",
          description: "Avaliação excluída com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir avaliação.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoadingAvaliacoes || isLoadingDisciplinas) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando avaliações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-gray-600">Gerencie suas avaliações e simulados</p>
        </div>
        <Button onClick={() => navigate('/professor/avaliacoes/nova')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(avaliacoes as any[]).length}</p>
                <p className="text-sm text-gray-600">Avaliações Criadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(avaliacoes as any[]).filter((a: any) => a.status === "rascunho").length}
                </p>
                <p className="text-sm text-gray-600">Aguardando Correção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(avaliacoes as any[]).reduce((sum: number, a: any) => sum + (a.tentativas || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Submissões Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Search className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-auto">
                {filteredAvaliacoes.length} de {(avaliacoes as any[]).length} avaliações
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="disciplina">Disciplina</Label>
              <Select value={selectedDisciplina} onValueChange={(value) => {
                setSelectedDisciplina(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as disciplinas</SelectItem>
                  {(disciplinas as any[]).map((disciplina: any) => (
                    <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                      {disciplina.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={selectedTipo} onValueChange={(value) => {
                setSelectedTipo(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="simulado">Simulado</SelectItem>
                  <SelectItem value="prova">Prova</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de avaliações ou estado vazio */}
      {currentAvaliacoes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {filteredAvaliacoes.length === 0 && (avaliacoes as any[]).length > 0 
                    ? "Nenhuma avaliação encontrada" 
                    : "Nenhuma avaliação cadastrada"}
                </h3>
                <p className="text-gray-600">
                  {filteredAvaliacoes.length === 0 && (avaliacoes as any[]).length > 0
                    ? "Tente ajustar os filtros para encontrar o que procura."
                    : "Comece criando sua primeira avaliação ou simulado."}
                </p>
              </div>
              {filteredAvaliacoes.length === 0 && (avaliacoes as any[]).length > 0 && (
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentAvaliacoes.map((avaliacao: any) => (
            <Card key={avaliacao.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{avaliacao.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {getDisciplinaNome(avaliacao.subjectId)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={avaliacao.tipo === 'simulado' ? 'secondary' : 'default'}>
                      {avaliacao.tipo}
                    </Badge>
                    <Badge variant={
                      avaliacao.status === 'publicado' ? 'default' : 
                      avaliacao.status === 'rascunho' ? 'secondary' : 'outline'
                    }>
                      {avaliacao.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {avaliacao.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {avaliacao.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Questões: {avaliacao.totalQuestoes || 0}</span>
                    <span>Tentativas: {avaliacao.tentativas || 0}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Período:</span>
                    <span className="ml-2">{avaliacao.dataInicio} até {avaliacao.dataFim}</span>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditAvaliacao(avaliacao.id)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewResults(avaliacao.id)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Resultados
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAvaliacao(avaliacao.id)}
                      className="hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 1
                    )
                    .map((page, index, visiblePages) => (
                      <div key={page}>
                        {index > 0 && visiblePages[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Próxima
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}