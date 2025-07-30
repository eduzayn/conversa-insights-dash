import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Users, 
  Clock, 
  FileText,
  Video,
  Plus,
  Settings,
  BarChart3
} from "lucide-react";

interface Subject {
  id: number;
  nome: string;
  codigo: string;
  area: string;
  cargaHoraria: number;
  descricao?: string;
  isActive: boolean;
  totalAlunos?: number;
  totalConteudos?: number;
  totalAvaliacoes?: number;
  progresso?: number;
}

export default function Disciplinas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDisciplina, setSelectedDisciplina] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    area: "",
    cargaHoraria: "",
    descricao: ""
  });

  // Buscar disciplinas do professor
  const { data: disciplinas = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/professor/subjects"],
  });

  // Mutation para criar nova disciplina
  const createSubjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/professor/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Disciplina criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/professor/subjects"] });
      setIsModalOpen(false);
      setFormData({
        nome: "",
        codigo: "",
        area: "",
        cargaHoraria: "",
        descricao: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar disciplina",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.codigo || !formData.area || !formData.cargaHoraria) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createSubjectMutation.mutate({
      ...formData,
      cargaHoraria: parseInt(formData.cargaHoraria)
    });
  };

  // Calcular estatísticas das disciplinas
  const stats = {
    totalDisciplinas: disciplinas.length,
    totalConteudos: disciplinas.reduce((sum: number, d: Subject) => sum + (d.totalConteudos || 0), 0),
    totalAvaliacoes: disciplinas.reduce((sum: number, d: Subject) => sum + (d.totalAvaliacoes || 0), 0),
    totalAlunos: disciplinas.reduce((sum: number, d: Subject) => sum + (d.totalAlunos || 0), 0)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Disciplinas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas disciplinas e visualize o progresso dos alunos
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Disciplina</DialogTitle>
              <DialogDescription>
                Adicione uma nova disciplina ao sistema e comece a gerenciar conteúdos e avaliações.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Disciplina</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Algoritmos e Programação I"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    placeholder="Ex: PROG001"
                    value={formData.codigo}
                    onChange={(e) => handleInputChange("codigo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargaHoraria">Carga Horária</Label>
                  <Input
                    id="cargaHoraria"
                    type="number"
                    placeholder="Ex: 80"
                    value={formData.cargaHoraria}
                    onChange={(e) => handleInputChange("cargaHoraria", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Área de Conhecimento</Label>
                <Select value={formData.area} onValueChange={(value) => handleInputChange("area", value)}>
                  <SelectTrigger className="w-full min-h-[40px] bg-background border border-input">
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-input shadow-md z-50" position="popper" sideOffset={4}>
                    <SelectItem value="ciencias-exatas" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Ciências Exatas</SelectItem>
                    <SelectItem value="ciencias-humanas" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Ciências Humanas</SelectItem>
                    <SelectItem value="ciencias-biologicas" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Ciências Biológicas</SelectItem>
                    <SelectItem value="engenharia" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Engenharia</SelectItem>
                    <SelectItem value="saude" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Saúde</SelectItem>
                    <SelectItem value="educacao" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Educação</SelectItem>
                    <SelectItem value="artes" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Artes</SelectItem>
                    <SelectItem value="linguistica" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Linguística</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva os objetivos e conteúdos da disciplina..."
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.nome || !formData.codigo}>
                Criar Disciplina
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDisciplinas}</p>
                <p className="text-sm text-gray-600">Disciplinas Ativas</p>
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
                  {disciplinas.reduce((sum: number, d: Subject) => sum + (d.totalAlunos || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {disciplinas.reduce((sum: number, d: Subject) => sum + (d.totalConteudos || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Conteúdos Criados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {disciplinas.reduce((sum: number, d: Subject) => sum + (d.totalAvaliacoes || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Avaliações Criadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disciplinas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando disciplinas...</span>
          </div>
        ) : disciplinas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Nenhuma disciplina encontrada. Crie sua primeira disciplina!</p>
          </div>
        ) : disciplinas.map((disciplina: Subject) => (
          <Card 
            key={disciplina.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedDisciplina === disciplina.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedDisciplina(disciplina.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{disciplina.nome}</CardTitle>
                  <CardDescription className="mt-1">
                    {disciplina.codigo} • {disciplina.area}
                  </CardDescription>
                </div>
                <Badge variant={disciplina.isActive ? 'default' : 'secondary'}>
                  {disciplina.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{disciplina.cargaHoraria}h de carga horária</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{disciplina.totalAlunos || 0}</p>
                  <p className="text-xs text-gray-600">Alunos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{disciplina.totalConteudos || 0}</p>
                  <p className="text-xs text-gray-600">Conteúdos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{disciplina.totalAvaliacoes || 0}</p>
                  <p className="text-xs text-gray-600">Avaliações</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progresso médio</span>
                  <span className="text-sm font-medium">{disciplina.progresso || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${disciplina.progresso || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/professor/conteudos');
                  }}
                >
                  <Settings className="h-3 w-3" />
                  Gerenciar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/professor/relatorios');
                  }}
                >
                  <BarChart3 className="h-3 w-3" />
                  Relatórios
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disciplina Selecionada - Detalhes */}
      {selectedDisciplina && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Disciplina</CardTitle>
            <CardDescription>
              Informações detalhadas e ações rápidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Ações Rápidas</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/professor/conteudos')}
                  >
                    <Video className="h-4 w-4" />
                    Adicionar Conteúdo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/professor/avaliacoes')}
                  >
                    <FileText className="h-4 w-4" />
                    Criar Avaliação
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/professor/submissoes')}
                  >
                    <Users className="h-4 w-4" />
                    Ver Alunos
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Últimas Atividades</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Nova submissão de prova</p>
                      <p className="text-xs text-gray-600">Maria Silva • há 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Vídeo assistido</p>
                      <p className="text-xs text-gray-600">João Santos • há 4 horas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Estatísticas</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Taxa de aprovação</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Engajamento médio</span>
                    <span className="text-sm font-medium">74%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nota média</span>
                    <span className="text-sm font-medium">8.2</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}