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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Users, 
  Clock, 
  FileText,
  Video,
  Plus,
  Settings,
  BarChart3,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Disciplinas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    area: "",
    cargaHoraria: "",
    descricao: ""
  });

  // Estados para filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("todas");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 4 colunas x 3 linhas

  // Buscar disciplinas da API
  const { data: disciplinas = [], isLoading } = useQuery({
    queryKey: ['/api/professor/subjects'],
    queryFn: async () => {
      const response = await apiRequest('/api/professor/subjects');
      return response as any[];
    }
  });

  // Filtros e paginação
  const filteredDisciplinas = useMemo(() => {
    let filtered = disciplinas.filter((disciplina) => {
      const matchesSearch = disciplina.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           disciplina.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           disciplina.area.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesArea = selectedArea === "todas" || disciplina.area === selectedArea;
      const matchesStatus = selectedStatus === "todos" || disciplina.status === selectedStatus;
      
      return matchesSearch && matchesArea && matchesStatus;
    });

    return filtered;
  }, [disciplinas, searchTerm, selectedArea, selectedStatus]);

  // Paginação
  const totalPages = Math.ceil(filteredDisciplinas.length / itemsPerPage);
  const paginatedDisciplinas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDisciplinas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDisciplinas, currentPage, itemsPerPage]);

  // Reset da página quando filtros mudam
  const resetPage = () => setCurrentPage(1);

  // Mutation para criar nova disciplina
  const createSubjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/professor/subjects', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          cargaHoraria: parseInt(data.cargaHoraria)
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/subjects'] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: 'Sucesso', description: 'Disciplina criada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar disciplina', variant: 'destructive' });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      area: "",
      cargaHoraria: "",
      descricao: ""
    });
  };

  const handleSubmit = () => {
    createSubjectMutation.mutate(formData);
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ciencias-exatas">Ciências Exatas</SelectItem>
                    <SelectItem value="ciencias-humanas">Ciências Humanas</SelectItem>
                    <SelectItem value="ciencias-biologicas">Ciências Biológicas</SelectItem>
                    <SelectItem value="engenharia">Engenharia</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="artes">Artes</SelectItem>
                    <SelectItem value="linguistica">Linguística</SelectItem>
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
                <p className="text-2xl font-bold">{disciplinas.length}</p>
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
                  {disciplinas.reduce((sum, d) => sum + d.totalAlunos, 0)}
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
                  {disciplinas.reduce((sum, d) => sum + d.totalConteudos, 0)}
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
                  {disciplinas.reduce((sum, d) => sum + d.totalAvaliacoes, 0)}
                </p>
                <p className="text-sm text-gray-600">Avaliações Criadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, código ou área..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetPage();
                }}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-3 items-center">
              <Filter className="h-4 w-4 text-gray-500" />
              
              {/* Filtro por Área */}
              <Select value={selectedArea} onValueChange={(value) => {
                setSelectedArea(value);
                resetPage();
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Áreas</SelectItem>
                  <SelectItem value="ciencias-exatas">Ciências Exatas</SelectItem>
                  <SelectItem value="ciencias-humanas">Ciências Humanas</SelectItem>
                  <SelectItem value="ciencias-biologicas">Ciências Biológicas</SelectItem>
                  <SelectItem value="engenharia">Engenharia</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="artes">Artes</SelectItem>
                  <SelectItem value="linguistica">Linguística</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por Status */}
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                resetPage();
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Informações dos resultados */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Exibindo {paginatedDisciplinas.length} de {filteredDisciplinas.length} disciplinas
              {filteredDisciplinas.length !== disciplinas.length && (
                <span className="text-blue-600"> (filtradas de {disciplinas.length} total)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disciplinas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedDisciplinas.map((disciplina) => (
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
                <Badge variant={disciplina.status === 'ativa' ? 'default' : 'secondary'}>
                  {disciplina.status === 'ativa' ? 'Ativa' : 'Inativa'}
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
                  <p className="text-2xl font-bold text-blue-600">{disciplina.totalAlunos}</p>
                  <p className="text-xs text-gray-600">Alunos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{disciplina.totalConteudos}</p>
                  <p className="text-xs text-gray-600">Conteúdos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{disciplina.totalAvaliacoes}</p>
                  <p className="text-xs text-gray-600">Avaliações</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progresso médio</span>
                  <span className="text-sm font-medium">{disciplina.progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${disciplina.progresso}%` }}
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

      {/* Estado vazio quando não há resultados */}
      {filteredDisciplinas.length === 0 && disciplinas.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma disciplina encontrada</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou termo de busca para encontrar as disciplinas desejadas.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedArea("todas");
                setSelectedStatus("todos");
                resetPage();
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio quando não há disciplinas */}
      {disciplinas.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma disciplina cadastrada</h3>
            <p className="text-gray-600 mb-4">
              Comece criando sua primeira disciplina para organizar conteúdos e avaliações.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeira Disciplina
            </Button>
          </CardContent>
        </Card>
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
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                {/* Números das páginas */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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