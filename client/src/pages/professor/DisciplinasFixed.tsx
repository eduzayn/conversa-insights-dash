import { useState } from "react";
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
  Edit,
  Trash2
} from "lucide-react";

export default function DisciplinasFixed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    area: "",
    cargaHoraria: "",
    descricao: ""
  });

  // Buscar disciplinas da API
  const { data: disciplinas = [], isLoading } = useQuery({
    queryKey: ['/api/professor/subjects'],
    queryFn: async () => {
      const response = await apiRequest('/api/professor/subjects');
      return response as any[];
    }
  });

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

  // Mutation para atualizar disciplina
  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/professor/subjects/${id}`, {
        method: 'PUT',
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
      setEditingDisciplina(null);
      resetForm();
      toast({ title: 'Sucesso', description: 'Disciplina atualizada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar disciplina', variant: 'destructive' });
    }
  });

  // Mutation para deletar disciplina
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/professor/subjects/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/subjects'] });
      toast({ title: 'Sucesso', description: 'Disciplina excluída com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir disciplina', variant: 'destructive' });
    }
  });

  const handleEditDisciplina = (disciplina: any) => {
    setEditingDisciplina(disciplina);
    setFormData({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      area: disciplina.area,
      cargaHoraria: disciplina.cargaHoraria.toString(),
      descricao: disciplina.descricao || ""
    });
    setIsModalOpen(true);
  };

  const handleDeleteDisciplina = (disciplinaId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta disciplina? Todos os conteúdos e avaliações relacionados também serão excluídos.")) {
      deleteSubjectMutation.mutate(disciplinaId);
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
      nome: "",
      codigo: "",
      area: "",
      cargaHoraria: "",
      descricao: ""
    });
    setEditingDisciplina(null);
  };

  const handleSubmit = () => {
    if (editingDisciplina) {
      updateSubjectMutation.mutate({ id: editingDisciplina.id, data: formData });
    } else {
      createSubjectMutation.mutate(formData);
    }
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
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingDisciplina ? "Editar Disciplina" : "Criar Nova Disciplina"}</DialogTitle>
              <DialogDescription>
                {editingDisciplina ? "Modifique as informações da disciplina" : "Adicione uma nova disciplina ao sistema e comece a gerenciar conteúdos e avaliações."}
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
                <Label htmlFor="area">Área</Label>
                <Select value={formData.area} onValueChange={(value) => handleInputChange("area", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ciências Exatas">Ciências Exatas</SelectItem>
                    <SelectItem value="Ciências Humanas">Ciências Humanas</SelectItem>
                    <SelectItem value="Ciências Biológicas">Ciências Biológicas</SelectItem>
                    <SelectItem value="Engenharias">Engenharias</SelectItem>
                    <SelectItem value="Artes">Artes</SelectItem>
                    <SelectItem value="Letras">Letras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva os objetivos e conteúdo da disciplina..."
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {(createSubjectMutation.isPending || updateSubjectMutation.isPending) ? "Salvando..." : (editingDisciplina ? "Atualizar" : "Criar Disciplina")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disciplinas.length}</div>
            <p className="text-xs text-muted-foreground">Total de disciplinas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Alunos matriculados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteúdos Criados</CardTitle>
            <Video className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">Vídeos, e-books e links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Criadas</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Provas e simulados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Disciplinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplinas.map((disciplina) => (
          <Card key={disciplina.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                {disciplina.nome}
              </CardTitle>
              <CardDescription>
                {disciplina.codigo} • {disciplina.area}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    Alunos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Video className="h-3 w-3" />
                    Conteúdos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <FileText className="h-3 w-3" />
                    Avaliações
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{disciplina.cargaHoraria}h</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Carga Horária
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progresso médio</span>
                  <span className="text-sm text-gray-600">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: '0%' }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge 
                  variant={disciplina.isActive ? "default" : "secondary"}
                  className="capitalize"
                >
                  {disciplina.isActive ? "Ativa" : "Inativa"}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDisciplina(disciplina)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/professor/conteudos?disciplina=${disciplina.id}`)}
                    className="flex-1"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDisciplina(disciplina.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                    disabled={deleteSubjectMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}