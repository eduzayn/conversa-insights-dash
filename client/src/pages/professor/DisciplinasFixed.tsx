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
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

export default function DisciplinasFixed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disciplinaToDelete, setDisciplinaToDelete] = useState<any>(null);
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
      setDeleteDialogOpen(false);
      setDisciplinaToDelete(null);
      toast({ title: 'Sucesso', description: 'Disciplina excluída com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir disciplina', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      area: "",
      cargaHoraria: "",
      descricao: ""
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setEditingDisciplina(null);
    setIsModalOpen(true);
  };

  const handleEditDisciplina = (disciplina: any) => {
    setEditingDisciplina(disciplina);
    setFormData({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      area: disciplina.area,
      cargaHoraria: disciplina.cargaHoraria.toString(),
      descricao: disciplina.descricao
    });
    setIsModalOpen(true);
  };

  const handleDeleteDisciplina = (disciplina: any) => {
    setDisciplinaToDelete(disciplina);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingDisciplina) {
      updateSubjectMutation.mutate({ id: editingDisciplina.id, data: formData });
    } else {
      createSubjectMutation.mutate(formData);
    }
  };

  const confirmDelete = () => {
    if (disciplinaToDelete) {
      deleteSubjectMutation.mutate(disciplinaToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1>
          <p className="text-gray-600">Gerencie suas disciplinas e conteúdos</p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Disciplina
        </Button>
      </div>

      {/* Grid de Disciplinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplinas.map((disciplina: any) => (
          <Card key={disciplina.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary">{disciplina.codigo}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDisciplina(disciplina)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDisciplina(disciplina)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{disciplina.nome}</CardTitle>
              <CardDescription>{disciplina.area}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {disciplina.cargaHoraria}h
                </div>
                
                {disciplina.descricao && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {disciplina.descricao}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/professor/conteudos?subject=${disciplina.id}`)}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="text-xs">Conteúdos</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/professor/avaliacoes?subject=${disciplina.id}`)}
                    className="flex items-center gap-1"
                  >
                    <BarChart3 className="h-3 w-3" />
                    <span className="text-xs">Avaliações</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/professor/relatorios?subject=${disciplina.id}`)}
                    className="flex items-center gap-1"
                  >
                    <Users className="h-3 w-3" />
                    <span className="text-xs">Alunos</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {disciplinas.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma disciplina encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Comece criando sua primeira disciplina
            </p>
            <Button onClick={handleOpenModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
            </DialogTitle>
            <DialogDescription>
              {editingDisciplina 
                ? 'Atualize as informações da disciplina' 
                : 'Preencha os dados da nova disciplina'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Disciplina</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Introdução à Programação"
              />
            </div>
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: PROG101"
              />
            </div>
            <div>
              <Label htmlFor="area">Área</Label>
              <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="Gestão">Gestão</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Humanas">Humanas</SelectItem>
                  <SelectItem value="Exatas">Exatas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
              <Input
                id="cargaHoraria"
                type="number"
                value={formData.cargaHoraria}
                onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
                placeholder="Ex: 60"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o conteúdo da disciplina..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingDisciplina ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir Disciplina"
        description={`Tem certeza que deseja excluir a disciplina "${disciplinaToDelete?.nome}"? Esta ação não pode ser desfeita e removerá todos os conteúdos e avaliações relacionados.`}
      />
    </div>
  );
}