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

export default function AvaliacoesFixed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<any>(null);
  const [isQuestoesModalOpen, setIsQuestoesModalOpen] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<any>(null);
  const [isCreateQuestionModalOpen, setIsCreateQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  
  // Estado para nova questão
  const [novaQuestao, setNovaQuestao] = useState({
    enunciado: "",
    tipo: "multipla_escolha",
    alternativas: ["", "", "", "", ""],
    gabarito: "",
    explicacao: "",
    peso: "1",
    imagemUrl: ""
  });
  
  // Estado para nova avaliação
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    titulo: "",
    descricao: "",
    disciplina: "",
    tipo: "avaliacao",
    duracao: "60",
    tentativas: "1",
    dataInicio: "",
    dataFim: "",
    instrucoes: ""
  });

  // Estado para editar avaliação
  const [avaliacaoEditando, setAvaliacaoEditando] = useState({
    titulo: "",
    descricao: "",
    disciplina: "",
    tipo: "avaliacao",
    duracao: "60",
    tentativas: "1",
    dataInicio: "",
    dataFim: "",
    instrucoes: ""
  });

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
    queryFn: async () => {
      const response = await apiRequest('/api/professor/evaluations');
      return response as any[];
    }
  });

  // Buscar disciplinas para filtros
  const { data: disciplinas = [], isLoading: isLoadingDisciplinas } = useQuery({
    queryKey: ['/api/professor/subjects'],
    queryFn: async () => {
      const response = await apiRequest('/api/professor/subjects');
      return response as any[];
    }
  });

  // Query para buscar questões da avaliação selecionada
  const { data: questoes = [], isLoading: isLoadingQuestoes, refetch: refetchQuestoes } = useQuery({
    queryKey: ['/api/professor/evaluations', avaliacaoSelecionada?.id, 'questions'],
    queryFn: async () => {
      if (!avaliacaoSelecionada?.id) return [];
      const response = await apiRequest(`/api/professor/evaluations/${avaliacaoSelecionada.id}/questions`);
      return response as any[];
    },
    enabled: !!avaliacaoSelecionada?.id
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

  // Mutations para avaliações
  const createEvaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/professor/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          titulo: data.titulo,
          descricao: data.descricao,
          subjectId: parseInt(data.disciplina),
          tipo: data.tipo,
          duracao: parseInt(data.duracao),
          tentativas: parseInt(data.tentativas),
          dataInicio: data.dataInicio || null,
          dataFim: data.dataFim || null,
          instrucoes: data.instrucoes
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      setIsCreateModalOpen(false);
      resetNovaAvaliacao();
      toast({ title: 'Sucesso', description: 'Avaliação criada com sucesso' });
    },
    onError: (error) => {
      console.error('Erro ao criar avaliação:', error);
      toast({ title: 'Erro', description: 'Erro ao criar avaliação', variant: 'destructive' });
    }
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/professor/evaluations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: data.titulo,
          descricao: data.descricao,
          subjectId: parseInt(data.disciplina),
          tipo: data.tipo,
          duracao: parseInt(data.duracao),
          tentativas: parseInt(data.tentativas),
          dataInicio: data.dataInicio || null,
          dataFim: data.dataFim || null,
          instrucoes: data.instrucoes
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      setIsEditModalOpen(false);
      setEditingAvaliacao(null);
      resetAvaliacaoEditando();
      toast({ title: 'Sucesso', description: 'Avaliação atualizada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar avaliação', variant: 'destructive' });
    }
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/professor/evaluations/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      toast({ title: 'Sucesso', description: 'Avaliação excluída com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir avaliação', variant: 'destructive' });
    }
  });

  // Funções auxiliares
  const resetNovaAvaliacao = () => {
    setNovaAvaliacao({
      titulo: "",
      descricao: "",
      disciplina: "",
      tipo: "avaliacao",
      duracao: "60",
      tentativas: "1",
      dataInicio: "",
      dataFim: "",
      instrucoes: ""
    });
  };

  const resetAvaliacaoEditando = () => {
    setAvaliacaoEditando({
      titulo: "",
      descricao: "",
      disciplina: "",
      tipo: "avaliacao",
      duracao: "60",
      tentativas: "1",
      dataInicio: "",
      dataFim: "",
      instrucoes: ""
    });
  };

  // Funções de ação
  const handleEditAvaliacao = (avaliacao: any) => {
    setEditingAvaliacao(avaliacao);
    setAvaliacaoEditando({
      titulo: avaliacao.titulo,
      descricao: avaliacao.descricao || "",
      disciplina: avaliacao.subjectId.toString(),
      tipo: avaliacao.tipo,
      duracao: avaliacao.duracao.toString(),
      tentativas: avaliacao.tentativas.toString(),
      dataInicio: avaliacao.dataInicio || "",
      dataFim: avaliacao.dataFim || "",
      instrucoes: avaliacao.instrucoes || ""
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteAvaliacao = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      deleteEvaluationMutation.mutate(id);
    }
  };

  const handleGerenciarQuestoes = (avaliacao: any) => {
    setAvaliacaoSelecionada(avaliacao);
    setIsQuestoesModalOpen(true);
    refetchQuestoes();
  };

  const handleCreateAvaliacao = () => {
    if (!novaAvaliacao.titulo || !novaAvaliacao.disciplina) {
      toast({ 
        title: 'Erro', 
        description: 'Preencha pelo menos o título e selecione uma disciplina', 
        variant: 'destructive' 
      });
      return;
    }
    createEvaluationMutation.mutate(novaAvaliacao);
  };

  const handleUpdateAvaliacao = () => {
    if (!avaliacaoEditando.titulo || !avaliacaoEditando.disciplina || !editingAvaliacao) {
      toast({ 
        title: 'Erro', 
        description: 'Preencha pelo menos o título e selecione uma disciplina', 
        variant: 'destructive' 
      });
      return;
    }
    updateEvaluationMutation.mutate({ id: editingAvaliacao.id, data: avaliacaoEditando });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-gray-600">Gerencie provas, testes e atividades avaliativas</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filtros</CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Disciplina</Label>
              <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as disciplinas</SelectItem>
                  {disciplinas.map((disciplina: any) => (
                    <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                      {disciplina.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="prova">Prova</SelectItem>
                  <SelectItem value="teste">Teste</SelectItem>
                  <SelectItem value="exercicio">Exercício</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicada">Publicada</SelectItem>
                  <SelectItem value="arquivada">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingAvaliacoes ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : currentAvaliacoes.length > 0 ? (
          currentAvaliacoes.map((avaliacao: any) => (
            <Card key={avaliacao.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <Badge variant="outline">{avaliacao.tipo}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAvaliacao(avaliacao)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAvaliacao(avaliacao.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{avaliacao.titulo}</CardTitle>
                <CardDescription>
                  {getDisciplinaNome(avaliacao.subjectId)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {avaliacao.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {avaliacao.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {avaliacao.duracao}min
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      {avaliacao.tentativas} tentativas
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGerenciarQuestoes(avaliacao)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerenciar Questões
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação criada'}
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros para encontrar o que procura'
                  : 'Comece criando sua primeira avaliação'
                }
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Avaliação
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de Criação de Avaliação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Avaliação</DialogTitle>
            <DialogDescription>
              Crie uma nova avaliação para seus alunos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={novaAvaliacao.titulo}
                onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, titulo: e.target.value })}
                placeholder="Ex: Prova de JavaScript"
              />
            </div>
            
            <div>
              <Label htmlFor="disciplina">Disciplina *</Label>
              <Select 
                value={novaAvaliacao.disciplina} 
                onValueChange={(value) => setNovaAvaliacao({ ...novaAvaliacao, disciplina: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((disciplina: any) => (
                    <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                      {disciplina.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={novaAvaliacao.tipo} 
                  onValueChange={(value) => setNovaAvaliacao({ ...novaAvaliacao, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                    <SelectItem value="prova">Prova</SelectItem>
                    <SelectItem value="teste">Teste</SelectItem>
                    <SelectItem value="exercicio">Exercício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={novaAvaliacao.duracao}
                  onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, duracao: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={novaAvaliacao.descricao}
                onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, descricao: e.target.value })}
                placeholder="Descreva a avaliação..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAvaliacao}>
              Criar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Avaliação */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Avaliação</DialogTitle>
            <DialogDescription>
              Atualize as informações da avaliação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo-edit">Título *</Label>
              <Input
                id="titulo-edit"
                value={avaliacaoEditando.titulo}
                onChange={(e) => setAvaliacaoEditando({ ...avaliacaoEditando, titulo: e.target.value })}
                placeholder="Ex: Prova de JavaScript"
              />
            </div>
            
            <div>
              <Label htmlFor="disciplina-edit">Disciplina *</Label>
              <Select 
                value={avaliacaoEditando.disciplina} 
                onValueChange={(value) => setAvaliacaoEditando({ ...avaliacaoEditando, disciplina: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((disciplina: any) => (
                    <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                      {disciplina.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo-edit">Tipo</Label>
                <Select 
                  value={avaliacaoEditando.tipo} 
                  onValueChange={(value) => setAvaliacaoEditando({ ...avaliacaoEditando, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                    <SelectItem value="prova">Prova</SelectItem>
                    <SelectItem value="teste">Teste</SelectItem>
                    <SelectItem value="exercicio">Exercício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="duracao-edit">Duração (min)</Label>
                <Input
                  id="duracao-edit"
                  type="number"
                  value={avaliacaoEditando.duracao}
                  onChange={(e) => setAvaliacaoEditando({ ...avaliacaoEditando, duracao: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao-edit">Descrição</Label>
              <Textarea
                id="descricao-edit"
                value={avaliacaoEditando.descricao}
                onChange={(e) => setAvaliacaoEditando({ ...avaliacaoEditando, descricao: e.target.value })}
                placeholder="Descreva a avaliação..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAvaliacao}>
              Atualizar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciar Questões */}
      <Dialog open={isQuestoesModalOpen} onOpenChange={setIsQuestoesModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Questões: {avaliacaoSelecionada?.titulo}
            </DialogTitle>
            <DialogDescription>
              Gerencie as questões desta avaliação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Questões ({questoes.length})
              </h3>
              <Button onClick={() => setIsCreateQuestionModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Questão
              </Button>
            </div>

            {isLoadingQuestoes ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : questoes.length > 0 ? (
              <div className="space-y-4">
                {questoes.map((questao: any, index: number) => (
                  <Card key={questao.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Questão {index + 1}</h4>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-2">
                        {questao.enunciado}
                      </p>
                      {questao.tipo === 'multipla_escolha' && questao.alternativas && (
                        <div className="ml-4 space-y-1">
                          {questao.alternativas.map((alt: string, altIndex: number) => (
                            <div key={altIndex} className="text-sm">
                              <span className={questao.gabarito === String.fromCharCode(65 + altIndex) ? 'font-bold text-green-600' : ''}>
                                {String.fromCharCode(65 + altIndex)}) {alt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>Tipo: {questao.tipo}</span>
                        <span>Peso: {questao.peso}</span>
                        {questao.gabarito && (
                          <span>Gabarito: {questao.gabarito}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma questão criada
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece adicionando questões à sua avaliação
                </p>
                <Button onClick={() => setIsCreateQuestionModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Primeira Questão
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}