import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Clock, Users, Plus, Settings, BarChart3, Edit, Trash2, CheckCircle } from "lucide-react";

export default function Avaliacoes() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questions, setQuestions] = useState([
    {
      id: 1,
      enunciado: "Qual é a complexidade do algoritmo de busca binária?",
      tipo: "multipla_escolha",
      alternativas: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      gabarito: 1,
      explicacao: "A busca binária divide o espaço de busca pela metade a cada iteração."
    }
  ]);

  // Dados mock das avaliações
  const avaliacoes = [
    {
      id: 1,
      titulo: "Prova 1 - Algoritmos Básicos",
      disciplina: "Algoritmos e Estruturas de Dados I",
      tipo: "prova",
      questoes: 10,
      tentativas: 25,
      status: "ativa",
      dataInicio: "2025-01-15",
      dataFim: "2025-01-20"
    },
    {
      id: 2,
      titulo: "Simulado - Estruturas de Dados",
      disciplina: "Algoritmos e Estruturas de Dados I",
      tipo: "simulado",
      questoes: 15,
      tentativas: 18,
      status: "rascunho",
      dataInicio: "2025-01-22",
      dataFim: "2025-01-25"
    }
  ];

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
      tarefa: "bg-orange-100 text-orange-800"
    };
    return variants[tipo as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avaliações e Simulados</h1>
          <p className="text-gray-600 mt-2">Crie e gerencie provas, simulados e exercícios</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
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
                <p className="text-2xl font-bold">5</p>
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
                <p className="text-2xl font-bold">147</p>
                <p className="text-sm text-gray-600">Submissões Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listar">Minhas Avaliações</TabsTrigger>
          <TabsTrigger value="criar">Criar Avaliação</TabsTrigger>
          <TabsTrigger value="questoes">Banco de Questões</TabsTrigger>
        </TabsList>

        <TabsContent value="listar" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {avaliacoes.map(avaliacao => (
              <Card key={avaliacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{avaliacao.titulo}</CardTitle>
                      <CardDescription>{avaliacao.disciplina}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getTipoBadge(avaliacao.tipo)}>
                        {avaliacao.tipo.charAt(0).toUpperCase() + avaliacao.tipo.slice(1)}
                      </Badge>
                      <Badge className={getStatusBadge(avaliacao.status)}>
                        {avaliacao.status.charAt(0).toUpperCase() + avaliacao.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Questões:</span>
                      <span className="ml-2 font-medium">{avaliacao.questoes}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tentativas:</span>
                      <span className="ml-2 font-medium">{avaliacao.tentativas}</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-600">Período:</span>
                    <span className="ml-2">{avaliacao.dataInicio} até {avaliacao.dataFim}</span>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Resultados
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="criar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Avaliação</CardTitle>
              <CardDescription>Configure uma nova prova, simulado ou tarefa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Avaliação</Label>
                  <Input id="titulo" placeholder="Ex: Prova 1 - Algoritmos Básicos" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">AED001 - Algoritmos e Estruturas de Dados I</SelectItem>
                      <SelectItem value="2">POO001 - Programação Orientada a Objetos</SelectItem>
                      <SelectItem value="3">BD001 - Banco de Dados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de avaliação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prova">Prova</SelectItem>
                      <SelectItem value="simulado">Simulado</SelectItem>
                      <SelectItem value="tarefa">Tarefa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input id="dataInicio" type="date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim</Label>
                  <Input id="dataFim" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição/Instruções</Label>
                <Textarea 
                  id="descricao" 
                  placeholder="Instruções gerais para os alunos"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tentativas">Tentativas Permitidas</Label>
                  <Input id="tentativas" type="number" placeholder="1" min="1" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempo">Tempo Limite (min)</Label>
                  <Input id="tempo" type="number" placeholder="60" min="5" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embaralhar">Embaralhar Questões</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sim/Não" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar e Adicionar Questões
                </Button>
                <Button variant="outline">
                  Salvar como Rascunho
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criar Questão</CardTitle>
              <CardDescription>Adicione questões de múltipla escolha com correção automática</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoQuestao">Tipo de Questão</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                      <SelectItem value="verdadeiro_falso">Verdadeiro ou Falso</SelectItem>
                      <SelectItem value="texto_livre">Texto Livre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dificuldade">Dificuldade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Nível de dificuldade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enunciado">Enunciado da Questão</Label>
                <Textarea 
                  id="enunciado" 
                  placeholder="Digite o enunciado da questão..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Alternativas (para múltipla escolha)</Label>
                {[0, 1, 2, 3].map(index => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="outline" className="min-w-[24px] h-6">
                      {String.fromCharCode(65 + index)}
                    </Badge>
                    <Input 
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    <Button
                      variant={index === 1 ? "default" : "outline"}
                      size="sm"
                      className="min-w-[80px]"
                    >
                      {index === 1 ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                      {index === 1 ? "Correta" : "Incorreta"}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="explicacao">Explicação do Gabarito</Label>
                <Textarea 
                  id="explicacao" 
                  placeholder="Explique por que esta é a resposta correta..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Questão
                </Button>
                <Button variant="outline">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questões Criadas</CardTitle>
              <CardDescription>Suas questões salvas no banco de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Questão {index + 1}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">Múltipla Escolha</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{question.enunciado}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {question.alternativas.map((alt, altIndex) => (
                        <div 
                          key={altIndex} 
                          className={`p-2 rounded ${altIndex === question.gabarito ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + altIndex)})</span>
                          {alt}
                          {altIndex === question.gabarito && (
                            <CheckCircle className="h-3 w-3 text-green-600 inline ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}