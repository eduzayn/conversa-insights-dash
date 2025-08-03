import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Video, BookOpen, Plus, ExternalLink, Edit, Trash2, Upload, Eye } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ConteudosFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [activeTab, setActiveTab] = useState("listar");
  const [editingContent, setEditingContent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [contentToPreview, setContentToPreview] = useState<any>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "video",
    url: "",
    descricao: "",
    ordem: "1",
    subjectId: ""
  });

  // Buscar disciplinas
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/professor/subjects'],
    queryFn: async () => {
      const response = await apiRequest('/api/professor/subjects');
      return response as any[];
    }
  });

  // Buscar conteúdos
  const { data: contents = [], isLoading } = useQuery({
    queryKey: ['/api/professor/contents', selectedSubject],
    queryFn: async () => {
      const url = selectedSubject && selectedSubject !== "all" 
        ? `/api/professor/contents?subjectId=${selectedSubject}`
        : '/api/professor/contents';
      const response = await apiRequest(url);
      // Mapear conteudo para url para compatibilidade com frontend
      return (response as any[]).map(content => ({
        ...content,
        url: content.conteudo || content.url
      }));
    }
  });

  // Mutation para criar conteúdo
  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/professor/contents', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          ordem: parseInt(data.ordem),
          subjectId: parseInt(data.subjectId)
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/contents'] });
      setActiveTab("listar");
      resetForm();
      toast({ title: 'Sucesso', description: 'Conteúdo criado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar conteúdo', variant: 'destructive' });
    }
  });

  // Mutation para atualizar conteúdo
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/professor/contents/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          ordem: parseInt(data.ordem),
          subjectId: parseInt(data.subjectId)
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/contents'] });
      setActiveTab("listar");
      setEditingContent(null);
      resetForm();
      toast({ title: 'Sucesso', description: 'Conteúdo atualizado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar conteúdo', variant: 'destructive' });
    }
  });

  // Mutation para deletar conteúdo
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/professor/contents/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/contents'] });
      toast({ title: 'Sucesso', description: 'Conteúdo excluído com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir conteúdo', variant: 'destructive' });
    }
  });

  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setFormData({
      titulo: content.titulo,
      tipo: content.tipo,
      url: content.url,
      descricao: content.descricao,
      ordem: content.ordem.toString(),
      subjectId: content.subjectId.toString()
    });
    setActiveTab("adicionar");
  };

  const handleDeleteContent = (content: any) => {
    setContentToDelete(content);
    setDeleteDialogOpen(true);
  };

  const handlePreviewContent = (content: any) => {
    setContentToPreview(content);
    setPreviewDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contentToDelete) {
      deleteContentMutation.mutate(contentToDelete.id);
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      tipo: "video",
      url: "",
      descricao: "",
      ordem: "1",
      subjectId: ""
    });
    setEditingContent(null);
  };

  const handleSubmit = () => {
    if (!formData.titulo || !formData.url || !formData.subjectId) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (editingContent) {
      updateContentMutation.mutate({ id: editingContent.id, data: formData });
    } else {
      createContentMutation.mutate(formData);
    }
  };

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'documento': return <FileText className="h-4 w-4" />;
      case 'scorm': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s: any) => s.id === subjectId);
    return subject ? subject.nome : 'Disciplina não encontrada';
  };

  // Filtrar conteúdos por disciplina selecionada
  const filteredContents = selectedSubject && selectedSubject !== "all" 
    ? contents.filter((content: any) => content.subjectId.toString() === selectedSubject)
    : contents;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteúdos</h1>
          <p className="text-gray-600">Gerencie os materiais de suas disciplinas</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="listar">Listar Conteúdos</TabsTrigger>
          <TabsTrigger value="adicionar">
            {editingContent ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listar" className="space-y-4">
          {/* Filtro por Disciplina */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Disciplina</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conteúdos */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredContents.length > 0 ? (
              filteredContents.map((content: any) => (
                <Card key={content.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getContentIcon(content.tipo)}
                          <h3 className="font-semibold text-lg">{content.titulo}</h3>
                          <Badge variant="outline" className="ml-2">
                            {content.tipo}
                          </Badge>
                          <Badge variant="secondary">
                            Ordem: {content.ordem}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Disciplina: {getSubjectName(content.subjectId)}
                        </p>
                        
                        {content.descricao && (
                          <p className="text-gray-600 text-sm mb-3">
                            {content.descricao}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>URL: {content.url}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewContent(content)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditContent(content)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContent(content)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum conteúdo encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedSubject && selectedSubject !== "all" 
                      ? "Não há conteúdos para a disciplina selecionada" 
                      : "Comece adicionando seu primeiro conteúdo"
                    }
                  </p>
                  <Button onClick={() => setActiveTab("adicionar")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Conteúdo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="adicionar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'}
              </CardTitle>
              <CardDescription>
                {editingContent 
                  ? 'Atualize as informações do conteúdo' 
                  : 'Adicione um novo material à sua disciplina'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Introdução ao React"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="scorm">SCORM</SelectItem>
                      <SelectItem value="link">Link Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectId">Disciplina *</Label>
                  <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="url">URL/Caminho *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://exemplo.com/video ou /path/para/arquivo"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o conteúdo do material..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!formData.titulo || !formData.url || !formData.subjectId}>
                  {editingContent ? 'Atualizar' : 'Criar'} Conteúdo
                </Button>
                <Button variant="outline" onClick={() => {
                  setActiveTab("listar");
                  resetForm();
                }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Preview */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview: {contentToPreview?.titulo}</DialogTitle>
            <DialogDescription>
              {contentToPreview?.descricao}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {contentToPreview && (
              <div className="space-y-4">
                {contentToPreview.tipo === 'video' && (
                  <div className="aspect-video">
                    <iframe
                      src={contentToPreview.url}
                      className="w-full h-full rounded"
                      allowFullScreen
                    />
                  </div>
                )}
                {contentToPreview.tipo === 'scorm' && (
                  <div className="aspect-video">
                    <iframe
                      src={contentToPreview.url}
                      className="w-full h-full rounded"
                      allowFullScreen
                    />
                  </div>
                )}
                {(contentToPreview.tipo === 'documento' || contentToPreview.tipo === 'link') && (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      {contentToPreview.tipo === 'documento' ? 'Documento' : 'Link externo'}
                    </p>
                    <Button asChild>
                      <a href={contentToPreview.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir {contentToPreview.tipo === 'documento' ? 'Documento' : 'Link'}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir Conteúdo"
        description={`Tem certeza que deseja excluir o conteúdo "${contentToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}