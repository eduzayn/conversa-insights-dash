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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    if (editingContent) {
      updateContentMutation.mutate({ id: editingContent.id, data: formData });
    } else {
      createContentMutation.mutate(formData);
    }
  };

  const filteredContents = selectedSubject && selectedSubject !== "all"
    ? contents.filter(content => content.subjectId === parseInt(selectedSubject))
    : contents;

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video className="h-4 w-4" />;
      case "ebook": return <BookOpen className="h-4 w-4" />;
      case "link": return <ExternalLink className="h-4 w-4" />;
      case "arquivo": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (tipo: string) => {
    switch (tipo) {
      case "video": return "bg-red-100 text-red-800";
      case "ebook": return "bg-blue-100 text-blue-800";
      case "link": return "bg-green-100 text-green-800";
      case "arquivo": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Função para detectar e converter URLs do Google Drive
  const getGoogleDriveEmbedUrl = (url: string) => {
    // Padrões de URL do Google Drive
    const patterns = [
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
      /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/,
      /https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const fileId = match[1];
        return {
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
          viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
          fileId
        };
      }
    }
    
    return null;
  };

  // Função para detectar tipo de arquivo do Google Drive
  const getGoogleDriveFileType = (url: string) => {
    if (url.includes('docs.google.com/document')) return 'document';
    if (url.includes('docs.google.com/spreadsheets')) return 'spreadsheet';
    if (url.includes('docs.google.com/presentation')) return 'presentation';
    if (url.includes('docs.google.com/forms')) return 'form';
    
    // Para arquivos do Drive, tentamos deduzir pelo contexto
    const driveInfo = getGoogleDriveEmbedUrl(url);
    if (driveInfo) {
      return 'file'; // Arquivo genérico no Drive
    }
    
    return null;
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
        <h1 className="text-3xl font-bold text-gray-900">Aulas e Conteúdos</h1>
        <p className="text-gray-600 mt-2">
          Adição e gerenciamento de vídeo-aulas, e-books e links úteis
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vídeo-aulas</CardTitle>
            <Video className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contents.filter(c => c.tipo === 'video').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-books</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contents.filter(c => c.tipo === 'ebook').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Links Úteis</CardTitle>
            <ExternalLink className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contents.filter(c => c.tipo === 'link').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conteúdos</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="listar">Listar Conteúdos</TabsTrigger>
            <TabsTrigger value="adicionar">
              {editingContent ? "Editar Conteúdo" : "Adicionar Conteúdo"}
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "listar" && (
            <Button onClick={() => { resetForm(); setActiveTab("adicionar"); }} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          )}
        </div>

        <TabsContent value="listar" className="space-y-6">
          {/* Filtro por Disciplina */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Disciplina</CardTitle>
              <CardDescription>Selecione uma disciplina para visualizar seus conteúdos</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Lista de Conteúdos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content) => (
              <Card key={content.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getContentIcon(content.tipo)}
                      <CardTitle className="text-lg">{content.titulo}</CardTitle>
                    </div>
                    <Badge className={getContentTypeColor(content.tipo)}>
                      {content.tipo}
                    </Badge>
                  </div>
                  <CardDescription>{content.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <ExternalLink className="h-3 w-3" />
                      <a href={content.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                        {content.url}
                      </a>
                    </div>
                    <div className="text-xs text-gray-500">
                      Ordem: {content.ordem}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewContent(content)}
                        className="flex-1 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContent(content)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContent(content)}
                        className="flex-1 hover:bg-red-50 hover:text-red-600"
                        disabled={deleteContentMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {deleteContentMutation.isPending ? "Excluindo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredContents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum conteúdo encontrado</p>
              <Button 
                onClick={() => { resetForm(); setActiveTab("adicionar"); }} 
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Conteúdo
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="adicionar">
          <Card>
            <CardHeader>
              <CardTitle>{editingContent ? "Editar Conteúdo" : "Adicionar Novo Conteúdo"}</CardTitle>
              <CardDescription>
                {editingContent ? "Modifique as informações do conteúdo" : "Preencha os dados do novo conteúdo"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Introdução aos Algoritmos"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange("titulo", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conteúdo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo-aula</SelectItem>
                      <SelectItem value="ebook">E-book</SelectItem>
                      <SelectItem value="link">Link Útil</SelectItem>
                      <SelectItem value="arquivo">Arquivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    placeholder="1"
                    value={formData.ordem}
                    onChange={(e) => handleInputChange("ordem", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL do Conteúdo</Label>
                <Input
                  id="url"
                  placeholder="Ex: https://youtube.com/watch?v=abc123"
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o conteúdo..."
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setActiveTab("listar"); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createContentMutation.isPending || updateContentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {(createContentMutation.isPending || updateContentMutation.isPending) ? "Salvando..." : (editingContent ? "Atualizar" : "Criar")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de conteúdo"
        description={`Tem certeza que deseja excluir o conteúdo "${contentToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
        entityName="conteúdo"
        isLoading={deleteContentMutation.isPending}
      />

      {/* Modal de Preview do Conteúdo */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Preview do Conteúdo - Visão do Aluno
            </DialogTitle>
            <DialogDescription>
              Esta é a visualização que os alunos verão ao acessar este conteúdo
            </DialogDescription>
          </DialogHeader>
          
          {contentToPreview && (
            <div className="space-y-6">
              {/* Header do Conteúdo */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {contentToPreview.titulo}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {getContentIcon(contentToPreview.tipo)}
                        <span className="capitalize">{contentToPreview.tipo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span>Ordem: {contentToPreview.ordem}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getContentTypeColor(contentToPreview.tipo)}>
                    {contentToPreview.tipo}
                  </Badge>
                </div>
                
                {contentToPreview.descricao && (
                  <p className="text-gray-700 leading-relaxed">
                    {contentToPreview.descricao}
                  </p>
                )}
              </div>

              {/* Conteúdo Embebido */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {getContentIcon(contentToPreview.tipo)}
                  Conteúdo
                </h3>
                
                {contentToPreview.tipo === 'video' && contentToPreview.url?.includes('youtube') && (
                  <div className="aspect-video w-full">
                    <iframe
                      src={contentToPreview.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                      className="w-full h-full rounded-lg"
                      frameBorder="0"
                      allowFullScreen
                      title={contentToPreview.titulo}
                    />
                  </div>
                )}
                
                {contentToPreview.tipo === 'video' && !contentToPreview.url?.includes('youtube') && (() => {
                  const driveInfo = getGoogleDriveEmbedUrl(contentToPreview.url);
                  
                  // Se for um vídeo do Google Drive, tenta fazer o embed
                  if (driveInfo) {
                    return (
                      <div className="space-y-4">
                        {/* Título do Vídeo */}
                        <div className="text-center">
                          <Video className="h-8 w-8 text-red-600 mx-auto mb-2" />
                          <h4 className="text-lg font-semibold text-gray-900">Vídeo-aula Interativa</h4>
                          <p className="text-sm text-gray-600">Visualização direta do Google Drive</p>
                        </div>
                        
                        {/* Iframe do Google Drive */}
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-black">
                          <iframe
                            src={driveInfo.embedUrl}
                            className="w-full h-[400px]"
                            frameBorder="0"
                            title={contentToPreview.titulo}
                            allow="autoplay; fullscreen"
                          />
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex justify-center gap-3">
                          <a 
                            href={driveInfo.viewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir no Drive
                          </a>
                          <a 
                            href={driveInfo.directUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            <Video className="h-4 w-4" />
                            Baixar Vídeo
                          </a>
                        </div>
                      </div>
                    );
                  }
                  
                  // Se não for Google Drive, mostra o layout original
                  return (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Vídeo</p>
                      <a 
                        href={contentToPreview.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir vídeo em nova aba
                      </a>
                    </div>
                  );
                })()}
                
                {contentToPreview.tipo === 'ebook' && (() => {
                  const driveInfo = getGoogleDriveEmbedUrl(contentToPreview.url);
                  const driveFileType = getGoogleDriveFileType(contentToPreview.url);
                  
                  // Se for um arquivo do Google Drive, tenta fazer o embed
                  if (driveInfo) {
                    return (
                      <div className="space-y-4">
                        {/* Título do E-book */}
                        <div className="text-center">
                          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <h4 className="text-lg font-semibold text-gray-900">E-book Interativo</h4>
                          <p className="text-sm text-gray-600">Visualização direta do Google Drive</p>
                        </div>
                        
                        {/* Iframe do Google Drive */}
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                          <iframe
                            src={driveInfo.embedUrl}
                            className="w-full h-[600px]"
                            frameBorder="0"
                            title={contentToPreview.titulo}
                            allow="autoplay"
                          />
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex justify-center gap-3">
                          <a 
                            href={driveInfo.viewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir no Drive
                          </a>
                          <a 
                            href={driveInfo.directUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            <BookOpen className="h-4 w-4" />
                            Baixar E-book
                          </a>
                        </div>
                      </div>
                    );
                  }
                  
                  // Se não for Google Drive, mostra o layout original
                  return (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">E-book disponível para download</p>
                      <a 
                        href={contentToPreview.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Baixar E-book
                      </a>
                    </div>
                  );
                })()}
                
                {contentToPreview.tipo === 'link' && (() => {
                  const driveInfo = getGoogleDriveEmbedUrl(contentToPreview.url);
                  const driveFileType = getGoogleDriveFileType(contentToPreview.url);
                  
                  // Se for um Google Docs, Sheets, etc.
                  if (driveFileType && ['document', 'spreadsheet', 'presentation', 'form'].includes(driveFileType)) {
                    const embedUrl = contentToPreview.url.includes('/edit') 
                      ? contentToPreview.url.replace('/edit', '/preview')
                      : contentToPreview.url + (contentToPreview.url.includes('?') ? '&' : '?') + 'embedded=true';
                    
                    return (
                      <div className="space-y-4">
                        {/* Título do Link */}
                        <div className="text-center">
                          <ExternalLink className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h4 className="text-lg font-semibold text-gray-900">
                            {driveFileType === 'document' && 'Documento Google'}
                            {driveFileType === 'spreadsheet' && 'Planilha Google'}
                            {driveFileType === 'presentation' && 'Apresentação Google'}
                            {driveFileType === 'form' && 'Formulário Google'}
                          </h4>
                          <p className="text-sm text-gray-600">Visualização incorporada</p>
                        </div>
                        
                        {/* Iframe do Google Docs/Sheets/etc */}
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                          <iframe
                            src={embedUrl}
                            className="w-full h-[600px]"
                            frameBorder="0"
                            title={contentToPreview.titulo}
                            allow="autoplay"
                          />
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex justify-center gap-3">
                          <a 
                            href={contentToPreview.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir no Google
                          </a>
                        </div>
                      </div>
                    );
                  }
                  
                  // Se for arquivo do Drive genérico
                  if (driveInfo) {
                    return (
                      <div className="space-y-4">
                        {/* Título do Link */}
                        <div className="text-center">
                          <ExternalLink className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h4 className="text-lg font-semibold text-gray-900">Arquivo do Google Drive</h4>
                          <p className="text-sm text-gray-600">Visualização incorporada</p>
                        </div>
                        
                        {/* Iframe do Google Drive */}
                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                          <iframe
                            src={driveInfo.embedUrl}
                            className="w-full h-[600px]"
                            frameBorder="0"
                            title={contentToPreview.titulo}
                            allow="autoplay"
                          />
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex justify-center gap-3">
                          <a 
                            href={driveInfo.viewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir no Drive
                          </a>
                          <a 
                            href={driveInfo.directUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <BookOpen className="h-4 w-4" />
                            Baixar Arquivo
                          </a>
                        </div>
                      </div>
                    );
                  }
                  
                  // Se não for Google, mostra o layout original
                  return (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <ExternalLink className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Link externo</p>
                      <a 
                        href={contentToPreview.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Acessar Link
                      </a>
                    </div>
                  );
                })()}
                
                {contentToPreview.tipo === 'arquivo' && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Arquivo para download</p>
                    <a 
                      href={contentToPreview.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Baixar Arquivo
                    </a>
                  </div>
                )}
              </div>

              {/* Footer com informações da disciplina */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Disciplina:</strong> {subjects.find(s => s.id === contentToPreview.subjectId)?.nome || 'Disciplina não encontrada'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}