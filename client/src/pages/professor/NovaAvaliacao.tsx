import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UniversalSelect } from "@/components/ui/universal-select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Save, FileText, Clock, Target } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NovaAvaliacaoData {
  titulo: string;
  descricao: string;
  disciplina: string;
  tipo: string;
  duracao: string;
  tentativas: string;
  dataInicio: string;
  dataFim: string;
  instrucoes: string;
}

export default function NovaAvaliacao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<NovaAvaliacaoData>({
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

  // Buscar disciplinas do professor
  const { data: disciplinas = [], isLoading: disciplinasLoading } = useQuery({
    queryKey: ['/api/professor/subjects'],
    enabled: true
  });

  const handleInputChange = (field: keyof NovaAvaliacaoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createAvaliacaoMutation = useMutation({
    mutationFn: async (data: NovaAvaliacaoData) => {
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
    onSuccess: (data) => {
      toast({
        title: "Avaliação criada com sucesso!",
        description: "Você pode agora adicionar questões à avaliação.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/professor/evaluations'] });
      
      // Redirecionar para página de edição da avaliação
      navigate(`/professor/avaliacoes/${data.id}/questoes`);
    },
    onError: () => {
      toast({
        title: "Erro ao criar avaliação",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!formData.titulo || !formData.disciplina) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o título e selecione uma disciplina.",
        variant: "destructive"
      });
      return;
    }

    createAvaliacaoMutation.mutate(formData);
  };

  const handleVoltar = () => {
    navigate('/professor/avaliacoes');
  };

  if (disciplinasLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleVoltar} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Avaliação</h1>
          <p className="text-gray-600 mt-1">
            Crie uma nova avaliação, simulado ou prova para seus alunos
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-sm font-medium">
                  Título da Avaliação *
                </Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Avaliação de Algoritmos - Módulo 1"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange("titulo", e.target.value)}
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
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
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
                    value={formData.disciplina}
                    onValueChange={(value) => handleInputChange("disciplina", value)}
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
                    value={formData.tipo}
                    onValueChange={(value) => handleInputChange("tipo", value)}
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
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Instruções para os Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="instrucoes" className="text-sm font-medium">
                  Instruções Detalhadas
                </Label>
                <Textarea
                  id="instrucoes"
                  placeholder="Digite as instruções que os alunos verão antes de iniciar a avaliação..."
                  value={formData.instrucoes}
                  onChange={(e) => handleInputChange("instrucoes", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-sm font-medium">
                    Duração (min)
                  </Label>
                  <Input
                    id="duracao"
                    type="number"
                    placeholder="60"
                    value={formData.duracao}
                    onChange={(e) => handleInputChange("duracao", e.target.value)}
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
                    value={formData.tentativas}
                    onChange={(e) => handleInputChange("tentativas", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="text-sm font-medium">
                  Data de Início
                </Label>
                <Input
                  id="dataInicio"
                  type="datetime-local"
                  value={formData.dataInicio}
                  onChange={(e) => handleInputChange("dataInicio", e.target.value)}
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
                  value={formData.dataFim}
                  onChange={(e) => handleInputChange("dataFim", e.target.value)}
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.titulo || !formData.disciplina || createAvaliacaoMutation.isPending}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {createAvaliacaoMutation.isPending ? "Criando..." : "Criar Avaliação"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleVoltar}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}