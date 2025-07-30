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

export default function AvaliacoesFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [activeTab, setActiveTab] = useState("listar");
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    subjectId: "",
    tipo: "prova",
    dataInicio: "",
    dataFim: "",
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

  const handleEditAvaliacao = (avaliacao: any) => {
    setEditingEvaluation(avaliacao);
    setFormData({
      titulo: avaliacao.titulo,
      subjectId: avaliacao.subjectId.toString(),
      tipo: avaliacao.tipo,
      dataInicio: avaliacao.dataInicio ? avaliacao.dataInicio.split('T')[0] : "",
      dataFim: avaliacao.dataFim ? avaliacao.dataFim.split('T')[0] : "",
      duracaoMinutos: avaliacao.duracaoMinutos?.toString() || "60",
      tentativasPermitidas: avaliacao.tentativasPermitidas?.toString() || "1",
      notaMinima: avaliacao.notaMinima?.toString() || "6",
      instrucoes: avaliacao.instrucoes || ""
    });
    setActiveTab("criar");
  };

  const handleDeleteAvaliacao = (avaliacaoId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta avaliação?")) {
      deleteEvaluationMutation.mutate(avaliacaoId);
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
      dataInicio: "",
      dataFim: "",
      duracaoMinutos: "60",
      tentativasPermitidas: "1",
      notaMinima: "6",
      instrucoes: ""
    });
    setEditingEvaluation(null);
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

                    {avaliacao.dataInicio && (
                      <div className="text-xs text-gray-500">
                        Período: {new Date(avaliacao.dataInicio).toLocaleDateString('pt-BR')} até {' '}
                        {avaliacao.dataFim ? new Date(avaliacao.dataFim).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </div>
                    )}

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
                        onClick={() => console.log("Ver resultados:", avaliacao.id)}
                        className="flex-1"
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Resultados
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAvaliacao(avaliacao.id)}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => handleInputChange("dataInicio", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => handleInputChange("dataFim", e.target.value)}
                  />
                </div>

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
              <CardTitle>Banco de Questões</CardTitle>
              <CardDescription>Gerencie suas questões reutilizáveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Banco de questões em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}