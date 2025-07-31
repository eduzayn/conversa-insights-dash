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
import { UniversalSelect } from "@/components/ui/universal-select";
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
  });

  // Buscar disciplinas para filtros
  const { data: disciplinas = [], isLoading: isLoadingDisciplinas } = useQuery({
    queryKey: ['/api/professor/subjects'],
  });

  // Query para buscar questões da avaliação selecionada
  const { data: questoes = [], isLoading: isLoadingQuestoes, refetch: refetchQuestoes } = useQuery({
    queryKey: ['/api/professor/evaluations', avaliacaoSelecionada?.id, 'questions'],
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

  // Funções de ação
  const handleEditAvaliacao = (avaliacao: any) => {
    setEditingAvaliacao(avaliacao);
    setAvaliacaoEditando({
      titulo: avaliacao.titulo || "",
      descricao: avaliacao.descricao || "",
      disciplina: avaliacao.subjectId?.toString() || "",
      tipo: avaliacao.tipo || "avaliacao",
      duracao: avaliacao.duracao?.toString() || "60",
      tentativas: avaliacao.maxAttempts?.toString() || "1",
      dataInicio: avaliacao.startDate || "",
      dataFim: avaliacao.endDate || "",
      instrucoes: avaliacao.instrucoes || ""
    });
    setIsEditModalOpen(true);
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

  // Mutation para criar nova avaliação
  const createAvaliacaoMutation = useMutation({
    mutationFn: async (data: typeof novaAvaliacao) => {
      const response = await apiRequest('/api/professor/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          title: data.titulo,
          description: data.descricao,
          subjectId: parseInt(data.disciplina),
          type: data.tipo,
          duration: parseInt(data.duracao),
          maxAttempts: parseInt(data.tentativas),
          startDate: data.dataInicio,
          endDate: data.dataFim,
          instructions: data.instrucoes,
          status: 'rascunho'
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar avaliação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação criada com sucesso!",
        description: "Você pode agora adicionar questões à avaliação.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      setIsCreateModalOpen(false);
      
      // Reset form
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
    },
    onError: () => {
      toast({
        title: "Erro ao criar avaliação",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  });

  // Mutation para editar avaliação
  const editAvaliacaoMutation = useMutation({
    mutationFn: async (data: typeof avaliacaoEditando) => {
      const response = await apiRequest(`/api/professor/evaluations/${editingAvaliacao.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: data.titulo,
          description: data.descricao,
          subjectId: parseInt(data.disciplina),
          type: data.tipo,
          duration: parseInt(data.duracao),
          maxAttempts: parseInt(data.tentativas),
          startDate: data.dataInicio,
          endDate: data.dataFim,
          instructions: data.instrucoes
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao editar avaliação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação atualizada com sucesso!",
        description: "As alterações foram salvas.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      setIsEditModalOpen(false);
      setEditingAvaliacao(null);
    },
    onError: () => {
      toast({
        title: "Erro ao editar avaliação",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  });

  const handleCreateAvaliacao = () => {
    if (!novaAvaliacao.titulo || !novaAvaliacao.disciplina) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o título e selecione uma disciplina.",
        variant: "destructive"
      });
      return;
    }

    createAvaliacaoMutation.mutate(novaAvaliacao);
  };

  const handleEditAvaliacaoSubmit = () => {
    if (!avaliacaoEditando.titulo || !avaliacaoEditando.disciplina) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o título e selecione uma disciplina.",
        variant: "destructive"
      });
      return;
    }

    editAvaliacaoMutation.mutate(avaliacaoEditando);
  };

  // Mutations para questões
  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof novaQuestao) => {
      const response = await apiRequest(`/api/professor/evaluations/${avaliacaoSelecionada.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          enunciado: data.enunciado,
          tipo: data.tipo,
          alternativas: data.alternativas.filter(alt => alt.trim() !== ''),
          gabarito: data.gabarito,
          explicacao: data.explicacao,
          peso: parseInt(data.peso) || 1,
          imagemUrl: data.imagemUrl || null,
          ordem: (questoes.length + 1)
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar questão');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Questão criada com sucesso!",
        description: "A questão foi adicionada à avaliação.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations', avaliacaoSelecionada.id, 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      setIsCreateQuestionModalOpen(false);
      
      // Reset form
      setNovaQuestao({
        enunciado: "",
        tipo: "multipla_escolha",
        alternativas: ["", "", "", "", ""],
        gabarito: "",
        explicacao: "",
        peso: "1",
        imagemUrl: ""
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar questão",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest(`/api/professor/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir questão');
      }
    },
    onSuccess: () => {
      toast({
        title: "Questão excluída com sucesso!",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations', avaliacaoSelecionada.id, 'questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir questão",
        variant: "destructive"
      });
    }
  });

  const handleAddQuestoes = (avaliacao: any) => {
    setAvaliacaoSelecionada(avaliacao);
    setIsQuestoesModalOpen(true);
  };

  const handleCreateQuestion = () => {
    if (!novaQuestao.enunciado.trim()) {
      toast({
        title: "Enunciado obrigatório",
        description: "Preencha o enunciado da questão.",
        variant: "destructive"
      });
      return;
    }

    if (novaQuestao.tipo === "multipla_escolha") {
      const alternativasValidas = novaQuestao.alternativas.filter(alt => alt.trim() !== '');
      if (alternativasValidas.length < 2) {
        toast({
          title: "Alternativas insuficientes",
          description: "Adicione pelo menos 2 alternativas.",
          variant: "destructive"
        });
        return;
      }
      
      if (!novaQuestao.gabarito) {
        toast({
          title: "Gabarito obrigatório",
          description: "Selecione a alternativa correta.",
          variant: "destructive"
        });
        return;
      }
    }

    createQuestionMutation.mutate(novaQuestao);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Tem certeza que deseja excluir esta questão?")) {
      deleteQuestionMutation.mutate(questionId);
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
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Avaliação</DialogTitle>
              <DialogDescription>
                Crie uma nova avaliação, simulado ou prova para seus alunos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo" className="text-sm font-medium">
                    Título da Avaliação *
                  </Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Avaliação de Algoritmos - Módulo 1"
                    value={novaAvaliacao.titulo}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, titulo: e.target.value }))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descreva brevemente o conteúdo e objetivos da avaliação..."
                    value={novaAvaliacao.descricao}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="disciplina" className="text-sm font-medium">
                      Disciplina *
                    </Label>
                    <UniversalSelect
                      value={novaAvaliacao.disciplina}
                      onValueChange={(value) => setNovaAvaliacao(prev => ({ ...prev, disciplina: value }))}
                      placeholder="Selecione uma disciplina"
                      className="h-11"
                      options={disciplinas.map((disciplina: any) => ({
                        value: disciplina.id.toString(),
                        label: disciplina.nome
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-sm font-medium">
                      Tipo de Avaliação
                    </Label>
                    <UniversalSelect
                      value={novaAvaliacao.tipo}
                      onValueChange={(value) => setNovaAvaliacao(prev => ({ ...prev, tipo: value }))}
                      placeholder="Selecione o tipo"
                      className="h-11"
                      options={[
                        { value: "avaliacao", label: "Avaliação" },
                        { value: "simulado", label: "Simulado" },
                        { value: "prova", label: "Prova" },
                        { value: "exercicio", label: "Exercício" }
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duracao" className="text-sm font-medium">
                      Duração (min)
                    </Label>
                    <Input
                      id="duracao"
                      type="number"
                      placeholder="60"
                      value={novaAvaliacao.duracao}
                      onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, duracao: e.target.value }))}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tentativas" className="text-sm font-medium">
                      Tentativas
                    </Label>
                    <Input
                      id="tentativas"
                      type="number"
                      placeholder="1"
                      value={novaAvaliacao.tentativas}
                      onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, tentativas: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio" className="text-sm font-medium">
                      Data de Início
                    </Label>
                    <Input
                      id="dataInicio"
                      type="datetime-local"
                      value={novaAvaliacao.dataInicio}
                      onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, dataInicio: e.target.value }))}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataFim" className="text-sm font-medium">
                      Data de Fim
                    </Label>
                    <Input
                      id="dataFim"
                      type="datetime-local"
                      value={novaAvaliacao.dataFim}
                      onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, dataFim: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrucoes" className="text-sm font-medium">
                    Instruções para os Alunos
                  </Label>
                  <Textarea
                    id="instrucoes"
                    placeholder="Digite as instruções que os alunos verão antes de iniciar a avaliação..."
                    value={novaAvaliacao.instrucoes}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, instrucoes: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAvaliacao}
                  disabled={!novaAvaliacao.titulo || !novaAvaliacao.disciplina || createAvaliacaoMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  {createAvaliacaoMutation.isPending ? "Criando..." : "Criar Avaliação"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Avaliação */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Avaliação</DialogTitle>
              <DialogDescription>
                Modifique os dados da avaliação conforme necessário.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Primeira linha - Título e Disciplina */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-titulo">Título da Avaliação *</Label>
                  <Input
                    id="edit-titulo"
                    placeholder="Ex: Avaliação Final - Algoritmos"
                    value={avaliacaoEditando.titulo}
                    onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, titulo: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-disciplina">Disciplina *</Label>
                  <UniversalSelect
                    value={avaliacaoEditando.disciplina}
                    onValueChange={(value: string) => setAvaliacaoEditando(prev => ({ ...prev, disciplina: value }))}
                    placeholder="Selecione uma disciplina"
                    options={(disciplinas as any[]).map((disciplina: any) => ({
                      value: disciplina.id.toString(),
                      label: disciplina.nome
                    }))}
                  />
                </div>
              </div>

              {/* Segunda linha - Tipo e Duração */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-tipo">Tipo de Avaliação</Label>
                  <UniversalSelect
                    value={avaliacaoEditando.tipo}
                    onValueChange={(value: string) => setAvaliacaoEditando(prev => ({ ...prev, tipo: value }))}
                    placeholder="Selecione o tipo"
                    options={[
                      { value: "avaliacao", label: "Avaliação" },
                      { value: "simulado", label: "Simulado" },
                      { value: "prova", label: "Prova" }
                    ]}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-duracao">Duração (minutos)</Label>
                  <Input
                    id="edit-duracao"
                    type="number"
                    placeholder="60"
                    value={avaliacaoEditando.duracao}
                    onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, duracao: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-tentativas">Tentativas Permitidas</Label>
                  <Input
                    id="edit-tentativas"
                    type="number"
                    placeholder="1"
                    value={avaliacaoEditando.tentativas}
                    onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, tentativas: e.target.value }))}
                  />
                </div>
              </div>

              {/* Terceira linha - Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dataInicio">Data de Início</Label>
                  <Input
                    id="edit-dataInicio"
                    type="datetime-local"
                    value={avaliacaoEditando.dataInicio}
                    onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, dataInicio: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-dataFim">Data de Fim</Label>
                  <Input
                    id="edit-dataFim"
                    type="datetime-local"
                    value={avaliacaoEditando.dataFim}
                    onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, dataFim: e.target.value }))}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  placeholder="Descreva brevemente o conteúdo e objetivos da avaliação..."
                  value={avaliacaoEditando.descricao}
                  onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Instruções */}
              <div>
                <Label htmlFor="edit-instrucoes">Instruções para os Alunos</Label>
                <Textarea
                  id="edit-instrucoes"
                  placeholder="Instruções detalhadas sobre como realizar a avaliação..."
                  value={avaliacaoEditando.instrucoes}
                  onChange={(e) => setAvaliacaoEditando(prev => ({ ...prev, instrucoes: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditAvaliacaoSubmit}
                  disabled={!avaliacaoEditando.titulo || !avaliacaoEditando.disciplina || editAvaliacaoMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Edit className="h-4 w-4" />
                  {editAvaliacaoMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <UniversalSelect
                value={selectedDisciplina}
                onValueChange={(value: string) => {
                  setSelectedDisciplina(value);
                  setCurrentPage(1);
                }}
                placeholder="Todas"
                options={[
                  { value: "todas", label: "Todas as disciplinas" },
                  ...(disciplinas as any[]).map((disciplina: any) => ({
                    value: disciplina.id.toString(),
                    label: disciplina.nome
                  }))
                ]}
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <UniversalSelect
                value={selectedTipo}
                onValueChange={(value: string) => {
                  setSelectedTipo(value);
                  setCurrentPage(1);
                }}
                placeholder="Todos"
                options={[
                  { value: "todos", label: "Todos os tipos" },
                  { value: "avaliacao", label: "Avaliação" },
                  { value: "simulado", label: "Simulado" },
                  { value: "prova", label: "Prova" }
                ]}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <UniversalSelect
                value={selectedStatus}
                onValueChange={(value: string) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
                placeholder="Todos"
                options={[
                  { value: "todos", label: "Todos os status" },
                  { value: "rascunho", label: "Rascunho" },
                  { value: "publicado", label: "Publicado" },
                  { value: "arquivado", label: "Arquivado" }
                ]}
              />
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

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestoes(avaliacao)}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Questões
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditAvaliacao(avaliacao)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
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

      {/* Modal de Questões */}
      <Dialog open={isQuestoesModalOpen} onOpenChange={setIsQuestoesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Questões</DialogTitle>
            <DialogDescription>
              {avaliacaoSelecionada?.titulo} - Adicione e gerencie as questões desta avaliação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header com informações da avaliação */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">{avaliacaoSelecionada?.titulo}</h3>
              <p className="text-sm text-blue-700">
                Disciplina: {getDisciplinaNome(avaliacaoSelecionada?.subjectId)} • 
                Tipo: {avaliacaoSelecionada?.tipo} • 
                Questões atuais: {avaliacaoSelecionada?.totalQuestoes || 0}
              </p>
            </div>

            {/* Botão para adicionar nova questão */}
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">Banco de Questões</h4>
              <Button 
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => setIsCreateQuestionModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Nova Questão
              </Button>
            </div>

            {/* Lista de questões */}
            {isLoadingQuestoes ? (
              <div className="border rounded-lg p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p>Carregando questões...</p>
              </div>
            ) : questoes && questoes.length > 0 ? (
              <div className="space-y-4">
                {questoes.map((questao: any, index: number) => (
                  <div key={questao.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Questão {index + 1}</Badge>
                        <Badge className={
                          questao.tipo === "multipla_escolha" ? "bg-blue-100 text-blue-800" :
                          questao.tipo === "dissertativa" ? "bg-green-100 text-green-800" :
                          "bg-purple-100 text-purple-800"
                        }>
                          {questao.tipo === "multipla_escolha" ? "Múltipla Escolha" :
                           questao.tipo === "dissertativa" ? "Dissertativa" :
                           "Verdadeiro/Falso"}
                        </Badge>
                        {questao.peso && questao.peso > 1 && (
                          <Badge variant="secondary">Peso {questao.peso}</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(questao);
                            setNovaQuestao({
                              enunciado: questao.enunciado,
                              tipo: questao.tipo,
                              alternativas: questao.alternativas || ["", "", "", "", ""],
                              gabarito: questao.gabarito?.toString() || "",
                              explicacao: questao.explicacao || "",
                              peso: questao.peso?.toString() || "1",
                              imagemUrl: questao.imagemUrl || ""
                            });
                            setIsCreateQuestionModalOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteQuestion(questao.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 text-gray-700">{questao.enunciado}</p>
                    
                    {questao.tipo === "multipla_escolha" && questao.alternativas && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {questao.alternativas.map((alternativa: string, idx: number) => (
                          <div 
                            key={idx} 
                            className={`p-2 rounded border text-xs ${
                              questao.gabarito === idx.toString() ? 
                                'bg-green-50 border-green-200 text-green-800' : 
                                'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + idx)}) </span>
                            {alternativa}
                            {questao.gabarito === idx.toString() && 
                              <span className="ml-2 text-green-600">✓ Correta</span>
                            }
                          </div>
                        ))}
                      </div>
                    )}

                    {questao.explicacao && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="font-medium text-blue-800">Explicação: </span>
                        <span className="text-blue-700">{questao.explicacao}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg p-6 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h4 className="font-medium mb-2">Nenhuma questão cadastrada</h4>
                <p className="text-sm">
                  Comece adicionando a primeira questão para esta avaliação
                </p>
              </div>
            )}

            {/* Footer com estatísticas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{questoes?.length || 0}</div>
                  <div className="text-sm text-gray-600">Questões</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {questoes?.filter((q: any) => q.tipo === "multipla_escolha")?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Múltipla Escolha</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {questoes?.filter((q: any) => q.tipo === "dissertativa")?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Dissertativas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões do modal */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsQuestoesModalOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Criar/Editar Questão */}
      <Dialog open={isCreateQuestionModalOpen} onOpenChange={setIsCreateQuestionModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Editar Questão" : "Nova Questão"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion ? "Edite os dados da questão" : "Adicione uma nova questão à avaliação"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Tipo da questão */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo da Questão *</label>
              <select 
                className="w-full border rounded-lg px-3 py-2"
                value={novaQuestao.tipo}
                onChange={(e) => {
                  const novoTipo = e.target.value;
                  setNovaQuestao(prev => ({ 
                    ...prev, 
                    tipo: novoTipo,
                    alternativas: novoTipo === "multipla_escolha" ? ["", "", "", "", ""] : [],
                    gabarito: ""
                  }));
                }}
              >
                <option value="multipla_escolha">Múltipla Escolha</option>
                <option value="dissertativa">Dissertativa</option>
                <option value="verdadeiro_falso">Verdadeiro/Falso</option>
              </select>
            </div>

            {/* Enunciado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Enunciado *</label>
              <textarea 
                className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                placeholder="Digite o enunciado da questão..."
                value={novaQuestao.enunciado}
                onChange={(e) => setNovaQuestao(prev => ({ ...prev, enunciado: e.target.value }))}
              />
            </div>

            {/* Alternativas (apenas para múltipla escolha) */}
            {novaQuestao.tipo === "multipla_escolha" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Alternativas *</label>
                {novaQuestao.alternativas.map((alternativa, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-sm font-medium w-8">{String.fromCharCode(65 + index)})</span>
                    <input 
                      type="text"
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                      value={alternativa}
                      onChange={(e) => {
                        const newAlternativas = [...novaQuestao.alternativas];
                        newAlternativas[index] = e.target.value;
                        setNovaQuestao(prev => ({ ...prev, alternativas: newAlternativas }));
                      }}
                    />
                    <input 
                      type="radio"
                      name="gabarito"
                      value={index.toString()}
                      checked={novaQuestao.gabarito === index.toString()}
                      onChange={(e) => setNovaQuestao(prev => ({ ...prev, gabarito: e.target.value }))}
                      className="w-4 h-4"
                      title="Marcar como resposta correta"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-500">Marque o botão de rádio na alternativa correta</p>
              </div>
            )}

            {/* Gabarito para Verdadeiro/Falso */}
            {novaQuestao.tipo === "verdadeiro_falso" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Resposta Correta *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      name="gabarito_vf"
                      value="true"
                      checked={novaQuestao.gabarito === "true"}
                      onChange={(e) => setNovaQuestao(prev => ({ ...prev, gabarito: e.target.value }))}
                    />
                    Verdadeiro
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio"
                      name="gabarito_vf"
                      value="false"
                      checked={novaQuestao.gabarito === "false"}
                      onChange={(e) => setNovaQuestao(prev => ({ ...prev, gabarito: e.target.value }))}
                    />
                    Falso
                  </label>
                </div>
              </div>
            )}

            {/* Explicação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Explicação (opcional)</label>
              <textarea 
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Explicação da resposta correta..."
                value={novaQuestao.explicacao}
                onChange={(e) => setNovaQuestao(prev => ({ ...prev, explicacao: e.target.value }))}
              />
            </div>

            {/* Peso e URL da Imagem */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso</label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  className="w-full border rounded-lg px-3 py-2"
                  value={novaQuestao.peso}
                  onChange={(e) => setNovaQuestao(prev => ({ ...prev, peso: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL da Imagem (opcional)</label>
                <input 
                  type="url"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://..."
                  value={novaQuestao.imagemUrl}
                  onChange={(e) => setNovaQuestao(prev => ({ ...prev, imagemUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateQuestionModalOpen(false);
                setEditingQuestion(null);
                setNovaQuestao({
                  enunciado: "",
                  tipo: "multipla_escolha",
                  alternativas: ["", "", "", ""],
                  gabarito: "",
                  explicacao: "",
                  peso: "1",
                  imagemUrl: ""
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateQuestion}
              disabled={createQuestionMutation.isPending}
            >
              {createQuestionMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                editingQuestion ? "Salvar Alterações" : "Criar Questão"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}