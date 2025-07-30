import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Clock, Users, Plus, Settings, BarChart3, Edit, Trash2, CheckCircle } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AvaliacoesFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [activeTab, setActiveTab] = useState("listar");
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<any>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [questionFormData, setQuestionFormData] = useState({
    enunciado: "",
    tipo: "multipla_escolha",
    alternativas: ["", "", "", ""],
    gabarito: "",
    explicacao: "",
    peso: "1"
  });
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    subjectId: "",
    tipo: "prova",
    duracaoMinutos: "60",
    tentativasPermitidas: "1",
    notaMinima: "6",
    instrucoes: ""
  });

  // Buscar disciplinas
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/professor/subjects'],
    queryFn: async () => {
      const response = await apiRequest('/api/professor/subjects');
      return response as any[];
    }
  });

  // Buscar avaliações
  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ['/api/professor/evaluations'],
    queryFn: async () => {
      const response = await apiRequest('/api/professor/evaluations');
      return response as any[];
    }
  });

  // Buscar questões de uma avaliação específica
  const { data: questions = [] } = useQuery({
    queryKey: ['/api/professor/evaluations', selectedEvaluation?.id, 'questions'],
    queryFn: async () => {
      if (!selectedEvaluation?.id) return [];
      const response = await apiRequest(`/api/professor/evaluations/${selectedEvaluation.id}/questions`);
      return response as any[];
    },
    enabled: !!selectedEvaluation?.id
  });

  // Buscar submissões de uma avaliação específica
  const { data: submissions = [] } = useQuery({
    queryKey: ['/api/professor/evaluations', selectedEvaluation?.id, 'submissions'],
    queryFn: async () => {
      if (!selectedEvaluation?.id) return [];
      const response = await apiRequest(`/api/professor/evaluations/${selectedEvaluation.id}/submissions`);
      return response as any[];
    },
    enabled: !!selectedEvaluation?.id
  });

  // Mutation para criar avaliação
  const createEvaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/professor/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          subjectId: parseInt(data.subjectId),
          duracaoMinutos: parseInt(data.duracaoMinutos),
          tentativasPermitidas: parseInt(data.tentativasPermitidas),
          notaMinima: parseFloat(data.notaMinima)
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      setActiveTab("listar");
      resetForm();
      toast({ title: 'Sucesso', description: 'Avaliação criada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar avaliação', variant: 'destructive' });
    }
  });

  // Mutation para deletar avaliação
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

  // Mutation para criar questão
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/professor/evaluations/${selectedEvaluation.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          peso: parseInt(data.peso),
          alternativas: data.tipo === 'multipla_escolha' ? data.alternativas : null
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Questão criada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations', selectedEvaluation?.id, 'questions'] });
      resetQuestionForm();
      setQuestionDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar questão', variant: 'destructive' });
    }
  });

  // Mutation para excluir questão
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return apiRequest(`/api/professor/evaluations/${selectedEvaluation.id}/questions/${questionId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Questão excluída com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations', selectedEvaluation?.id, 'questions'] });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir questão', variant: 'destructive' });
    }
  });

  const handleEditAvaliacao = (avaliacao: any) => {
    setEditingEvaluation(avaliacao);
    setFormData({
      titulo: avaliacao.titulo,
      subjectId: avaliacao.subjectId.toString(),
      tipo: avaliacao.tipo,
      duracaoMinutos: avaliacao.duracaoMinutos?.toString() || "60",
      tentativasPermitidas: avaliacao.tentativasPermitidas?.toString() || "1",
      notaMinima: avaliacao.notaMinima?.toString() || "6",
      instrucoes: avaliacao.instrucoes || ""
    });
    setActiveTab("criar");
  };

  const handleDeleteAvaliacao = (avaliacao: any) => {
    setEvaluationToDelete(avaliacao);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (evaluationToDelete) {
      deleteEvaluationMutation.mutate(evaluationToDelete.id);
      setDeleteDialogOpen(false);
      setEvaluationToDelete(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      subjectId: "",
      tipo: "prova",
      duracaoMinutos: "60",
      tentativasPermitidas: "1",
      notaMinima: "6",
      instrucoes: ""
    });
    setEditingEvaluation(null);
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      enunciado: "",
      tipo: "multipla_escolha",
      alternativas: ["", "", "", ""],
      gabarito: "",
      explicacao: "",
      peso: "1"
    });
    setEditingQuestion(null);
  };

  const handleQuestionInputChange = (field: string, value: string | string[]) => {
    setQuestionFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAlternativeChange = (index: number, value: string) => {
    const newAlternativas = [...questionFormData.alternativas];
    newAlternativas[index] = value;
    setQuestionFormData(prev => ({
      ...prev,
      alternativas: newAlternativas
    }));
  };

  const handleCreateQuestion = () => {
    if (!selectedEvaluation) return;
    createQuestionMutation.mutate({
      evaluationId: selectedEvaluation.id,
      ...questionFormData
    });
  };

  const handleViewQuestions = (avaliacao: any) => {
    setSelectedEvaluation(avaliacao);
    setActiveTab("banco");
  };

  const handleBackToList = () => {
    setSelectedEvaluation(null);
    setActiveTab("listar");
  };

  const handleSubmit = () => {
    createEvaluationMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativa: "bg-green-100 text-green-800",
      rascunho: "bg-yellow-100 text-yellow-800",
      encerrada: "bg-gray-100 text-gray-800"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  const getTipoBadge = (tipo: string) => {
    const variants = {
      prova: "bg-blue-100 text-blue-800",
      simulado: "bg-purple-100 text-purple-800",
      exercicio: "bg-green-100 text-green-800"
    };
    return variants[tipo as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avaliações e Simulados</h1>
        <p className="text-gray-600 mt-2">
          Crie e gerencie provas, simulados e exercícios
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Criadas</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avaliacoes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Correção</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissões Totais</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="listar">Minhas Avaliações</TabsTrigger>
            <TabsTrigger value="criar">
              {editingEvaluation ? "Editar Avaliação" : "Criar Avaliação"}
            </TabsTrigger>
            <TabsTrigger value="banco">Banco de Questões</TabsTrigger>
          </TabsList>
          
          {activeTab === "listar" && (
            <Button onClick={() => { resetForm(); setActiveTab("criar"); }} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          )}
        </div>

        <TabsContent value="listar" className="space-y-6">
          {/* Lista de Avaliações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {avaliacoes.map((avaliacao) => (
              <Card key={avaliacao.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{avaliacao.titulo}</CardTitle>
                      <CardDescription>
                        {subjects.find(s => s.id === avaliacao.subjectId)?.nome}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getTipoBadge(avaliacao.tipo)}>
                        {avaliacao.tipo}
                      </Badge>
                      <Badge className={getStatusBadge(avaliacao.isActive ? "ativa" : "rascunho")}>
                        {avaliacao.isActive ? "Ativa" : "Rascunho"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">0</div>
                        <div className="text-gray-600">Questões</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">0</div>
                        <div className="text-gray-600">Tentativas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{avaliacao.duracaoMinutos || 60}</div>
                        <div className="text-gray-600">Minutos</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Disponível durante todo o período do contrato
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAvaliacao(avaliacao)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuestions(avaliacao)}
                        className="flex-1"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Questões
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAvaliacao(avaliacao)}
                        className="hover:bg-red-50 hover:text-red-600"
                        disabled={deleteEvaluationMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {avaliacoes.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma avaliação encontrada</p>
              <Button 
                onClick={() => { resetForm(); setActiveTab("criar"); }} 
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Avaliação
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="criar">
          <Card>
            <CardHeader>
              <CardTitle>{editingEvaluation ? "Editar Avaliação" : "Criar Nova Avaliação"}</CardTitle>
              <CardDescription>
                {editingEvaluation ? "Modifique as configurações da avaliação" : "Configure uma nova prova ou simulado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Avaliação</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Prova 1 - Algoritmos Básicos"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange("titulo", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectId">Disciplina</Label>
                  <Select value={formData.subjectId} onValueChange={(value) => handleInputChange("subjectId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prova">Prova</SelectItem>
                      <SelectItem value="simulado">Simulado</SelectItem>
                      <SelectItem value="exercicio">Exercício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracaoMinutos">Duração (minutos)</Label>
                  <Input
                    id="duracaoMinutos"
                    type="number"
                    placeholder="60"
                    value={formData.duracaoMinutos}
                    onChange={(e) => handleInputChange("duracaoMinutos", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tentativasPermitidas">Tentativas Permitidas</Label>
                  <Input
                    id="tentativasPermitidas"
                    type="number"
                    placeholder="1"
                    value={formData.tentativasPermitidas}
                    onChange={(e) => handleInputChange("tentativasPermitidas", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notaMinima">Nota Mínima</Label>
                  <Input
                    id="notaMinima"
                    type="number"
                    step="0.1"
                    placeholder="6.0"
                    value={formData.notaMinima}
                    onChange={(e) => handleInputChange("notaMinima", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrucoes">Instruções</Label>
                <Textarea
                  id="instrucoes"
                  placeholder="Instruções para os alunos..."
                  value={formData.instrucoes}
                  onChange={(e) => handleInputChange("instrucoes", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setActiveTab("listar"); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createEvaluationMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createEvaluationMutation.isPending ? "Criando..." : (editingEvaluation ? "Atualizar" : "Criar Avaliação")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banco">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedEvaluation ? `Questões - ${selectedEvaluation.titulo}` : "Banco de Questões"}
                  </CardTitle>
                  <CardDescription>
                    {selectedEvaluation ? "Gerencie as questões desta avaliação" : "Gerencie suas questões reutilizáveis"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedEvaluation && (
                    <Button variant="outline" onClick={handleBackToList}>
                      Voltar
                    </Button>
                  )}
                  {selectedEvaluation && (
                    <Button onClick={() => setQuestionDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Questão
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedEvaluation ? (
                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhuma questão criada ainda</p>
                      <Button 
                        onClick={() => setQuestionDialogOpen(true)} 
                        className="mt-4 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Questão
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <Card key={question.id} className="border">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">Questão {index + 1}</Badge>
                                  <Badge className={question.tipo === 'multipla_escolha' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                    {question.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Verdadeiro/Falso'}
                                  </Badge>
                                  <Badge variant="secondary">Peso: {question.peso}</Badge>
                                </div>
                                <p className="text-sm font-medium">{question.enunciado}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteQuestionMutation.mutate(question.id)}
                                className="hover:bg-red-50 hover:text-red-600"
                                disabled={deleteQuestionMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {question.tipo === 'multipla_escolha' && question.alternativas && (
                              <div className="space-y-2">
                                {question.alternativas.map((alt: string, altIndex: number) => (
                                  <div key={altIndex} className={`flex items-center gap-2 p-2 rounded ${question.gabarito === altIndex.toString() ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                    <span className="font-mono text-sm">{String.fromCharCode(65 + altIndex)})</span>
                                    <span className="text-sm">{alt}</span>
                                    {question.gabarito === altIndex.toString() && (
                                      <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {question.explicacao && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-800"><strong>Explicação:</strong> {question.explicacao}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Selecione uma avaliação para gerenciar suas questões</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de avaliação"
        description={`Tem certeza que deseja excluir a avaliação "${evaluationToDelete?.titulo}"? Todas as questões e submissões relacionadas também serão excluídas permanentemente.`}
        entityName="avaliação"
        isLoading={deleteEvaluationMutation.isPending}
      />

      {/* Modal para criar questão */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Questão</DialogTitle>
            <DialogDescription>
              Crie uma nova questão para a avaliação "{selectedEvaluation?.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="enunciado">Enunciado da Questão *</Label>
              <Textarea
                id="enunciado"
                placeholder="Digite o enunciado da questão..."
                value={questionFormData.enunciado}
                onChange={(e) => handleQuestionInputChange('enunciado', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Questão</Label>
                <Select value={questionFormData.tipo} onValueChange={(value) => handleQuestionInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                    <SelectItem value="verdadeiro_falso">Verdadeiro/Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="peso">Peso da Questão</Label>
                <Input
                  id="peso"
                  type="number"
                  min="1"
                  max="10"
                  value={questionFormData.peso}
                  onChange={(e) => handleQuestionInputChange('peso', e.target.value)}
                />
              </div>
            </div>

            {questionFormData.tipo === 'multipla_escolha' && (
              <div>
                <Label>Alternativas</Label>
                <div className="space-y-3 mt-2">
                  {questionFormData.alternativas.map((alt, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="font-mono text-sm w-6">{String.fromCharCode(65 + index)})</span>
                      <Input
                        placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                        value={alt}
                        onChange={(e) => handleAlternativeChange(index, e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="gabarito"
                          value={index.toString()}
                          checked={questionFormData.gabarito === index.toString()}
                          onChange={(e) => handleQuestionInputChange('gabarito', e.target.value)}
                          className="w-4 h-4 text-green-600"
                        />
                        <Label className="ml-2 text-sm">Correta</Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {questionFormData.tipo === 'verdadeiro_falso' && (
              <div>
                <Label>Resposta Correta</Label>
                <Select value={questionFormData.gabarito} onValueChange={(value) => handleQuestionInputChange('gabarito', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a resposta correta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verdadeiro">Verdadeiro</SelectItem>
                    <SelectItem value="falso">Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="explicacao">Explicação (Opcional)</Label>
              <Textarea
                id="explicacao"
                placeholder="Explicação da resposta correta..."
                value={questionFormData.explicacao}
                onChange={(e) => handleQuestionInputChange('explicacao', e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateQuestion} 
              disabled={createQuestionMutation.isPending || !questionFormData.enunciado || !questionFormData.gabarito}
              className="bg-green-600 hover:bg-green-700"
            >
              {createQuestionMutation.isPending ? 'Criando...' : 'Criar Questão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}