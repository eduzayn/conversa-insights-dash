import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Users, 
  Clock,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function AvaliacoesFixed() {
  const [selectedDisciplina, setSelectedDisciplina] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    disciplina: "",
    tipo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    tentativas: "1"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log("Nova avaliação:", formData);
    setIsModalOpen(false);
    setFormData({
      titulo: "",
      disciplina: "",
      tipo: "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
      tentativas: "1"
    });
  };

  // Mock data para avaliações
  const avaliacoes = [
    {
      id: 1,
      titulo: "Prova 1 - Algoritmos Básicos",
      disciplina: "Algoritmos e Programação I",
      tipo: "prova",
      status: "ativa",
      dataInicio: "2024-01-15",
      dataFim: "2024-01-20",
      totalAlunos: 45,
      submissoes: 42,
      mediaNotas: 7.8
    },
    {
      id: 2,
      titulo: "Exercícios - Estruturas de Dados",
      disciplina: "Estruturas de Dados",
      tipo: "exercicio",
      status: "rascunho",
      dataInicio: "2024-01-25",
      dataFim: "2024-01-30",
      totalAlunos: 38,
      submissoes: 0,
      mediaNotas: null
    },
    {
      id: 3,
      titulo: "Projeto Final - Sistema de BD",
      disciplina: "Banco de Dados",
      tipo: "projeto",
      status: "finalizada",
      dataInicio: "2024-01-01",
      dataFim: "2024-01-14",
      totalAlunos: 73,
      submissoes: 71,
      mediaNotas: 8.2
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativa":
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case "finalizada":
        return <Badge className="bg-blue-100 text-blue-800">Finalizada</Badge>;
      case "rascunho":
        return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "prova":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "exercicio":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "projeto":
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const avaliacoesFiltradas = selectedDisciplina === "todos" 
    ? avaliacoes 
    : avaliacoes.filter(a => a.disciplina === selectedDisciplina);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-gray-600">Crie e gerencie provas, exercícios e projetos</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Avaliação</DialogTitle>
              <DialogDescription>
                Configure uma nova avaliação para suas disciplinas
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da Avaliação</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange("titulo", e.target.value)}
                  placeholder="Ex: Prova 1 - Algoritmos Básicos"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select onValueChange={(value) => handleInputChange("disciplina", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="algoritmos">Algoritmos e Programação I</SelectItem>
                      <SelectItem value="estruturas">Estruturas de Dados</SelectItem>
                      <SelectItem value="banco">Banco de Dados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Avaliação</Label>
                  <Select onValueChange={(value) => handleInputChange("tipo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prova">Prova</SelectItem>
                      <SelectItem value="exercicio">Lista de Exercícios</SelectItem>
                      <SelectItem value="projeto">Projeto</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  placeholder="Descreva a avaliação..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tentativas">Número de Tentativas</Label>
                <Select value={formData.tentativas} onValueChange={(value) => handleInputChange("tentativas", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tentativa</SelectItem>
                    <SelectItem value="2">2 tentativas</SelectItem>
                    <SelectItem value="3">3 tentativas</SelectItem>
                    <SelectItem value="ilimitado">Ilimitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                Criar Avaliação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrar por disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Disciplinas</SelectItem>
            <SelectItem value="Algoritmos e Programação I">Algoritmos e Programação I</SelectItem>
            <SelectItem value="Estruturas de Dados">Estruturas de Dados</SelectItem>
            <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Avaliações */}
      <div className="grid gap-6">
        {avaliacoesFiltradas.map((avaliacao) => (
          <Card key={avaliacao.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getTipoIcon(avaliacao.tipo)}
                  <div>
                    <CardTitle className="text-lg font-semibold">{avaliacao.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {avaliacao.disciplina}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(avaliacao.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Informações de Data */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(avaliacao.dataInicio).toLocaleDateString()} - {new Date(avaliacao.dataFim).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{avaliacao.tipo.charAt(0).toUpperCase() + avaliacao.tipo.slice(1)}</span>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{avaliacao.submissoes}/{avaliacao.totalAlunos} submissões</span>
                  </div>
                  {avaliacao.mediaNotas && (
                    <div className="text-sm">
                      <span className="font-medium">Média: </span>
                      <span className={`font-bold ${
                        avaliacao.mediaNotas >= 7 ? 'text-green-600' : 
                        avaliacao.mediaNotas >= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {avaliacao.mediaNotas.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline">
                    Ver Detalhes
                  </Button>
                  <Button size="sm" variant="outline">
                    Resultados
                  </Button>
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {avaliacoesFiltradas.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma avaliação encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">Comece criando sua primeira avaliação.</p>
          <div className="mt-6">
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}