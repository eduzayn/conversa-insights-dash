import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { FileText, Video, BookOpen, Plus, ExternalLink, Edit, Trash2, Upload } from "lucide-react";

export default function Conteudos() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [activeTab, setActiveTab] = useState("listar");
  const [editingContent, setEditingContent] = useState<any>(null);
  const [deleteContentId, setDeleteContentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subjectId: "",
    titulo: "",
    tipo: "",
    conteudo: "",
    descricao: "",
    ordem: 1
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar disciplinas do professor
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<any[]>({
    queryKey: ['/api/professor/subjects'],
  });

  // Query para buscar conteúdos baseado na disciplina selecionada
  const { data: contents = [], isLoading: contentsLoading, error: contentsError } = useQuery<any[]>({
    queryKey: [`/api/professor/contents?subjectId=${selectedSubject}`],
    enabled: !!selectedSubject && selectedSubject !== 'all',
  });

  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setFormData({
      subjectId: content.subjectId?.toString() || "",
      titulo: content.titulo || "",
      tipo: content.tipo || "",
      conteudo: content.conteudo || "",
      descricao: content.descricao || "",
      ordem: content.ordem || 1
    });
    setActiveTab("adicionar");
  };

  // Mutation para deletar conteúdo
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/professor/contents/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir conteúdo');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Conteúdo excluído com sucesso!",
      });
      // Invalidar cache específico usando a mesma chave do query
      queryClient.invalidateQueries({ queryKey: [`/api/professor/contents?subjectId=${selectedSubject}`] });
      setDeleteContentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setDeleteContentId(null);
    },
  });

  const handleDeleteContent = (contentId: number) => {
    setDeleteContentId(contentId);
  };

  const confirmDeleteContent = () => {
    if (deleteContentId) {
      deleteContentMutation.mutate(deleteContentId);
    }
  };

  // Mutation para criar conteúdo
  const createContentMutation = useMutation({
    mutationFn: async (contentData: any) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/professor/contents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conteúdo');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Conteúdo criado com sucesso!",
      });
      // Limpar formulário
      setFormData({
        subjectId: "",
        titulo: "",
        tipo: "",
        conteudo: "",
        descricao: "",
        ordem: 1
      });
      setEditingContent(null);
      setActiveTab("listar");
      // Invalidar cache específico usando a mesma chave do query
      queryClient.invalidateQueries({ queryKey: [`/api/professor/contents?subjectId=${selectedSubject}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateContent = () => {
    if (!formData.subjectId || !formData.titulo || !formData.tipo || !formData.conteudo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createContentMutation.mutate({
      subjectId: parseInt(formData.subjectId),
      titulo: formData.titulo,
      tipo: formData.tipo,
      conteudo: formData.conteudo,
      descricao: formData.descricao,
      ordem: formData.ordem
    });
  };

  // Dados mock para os conteúdos caso não haja filtro ativo
  const mockContents = [
    {
      id: 1,
      titulo: "Introdução aos Algoritmos",
      tipo: "video",
      url: "https://youtube.com/watch?v=abc123",
      descricao: "Conceitos básicos de algoritmos e estruturas de dados",
      ordem: 1,
      subjectId: 1
    },
    {
      id: 2,
      titulo: "Apostila de POO",
      tipo: "ebook",
      url: "https://drive.google.com/file/d/xyz789",
      descricao: "Material completo sobre Programação Orientada a Objetos",
      ordem: 2,
      subjectId: 2
    },
    {
      id: 3,
      titulo: "Documentação MySQL",
      tipo: "link",
      url: "https://dev.mysql.com/doc/",
      descricao: "Documentação oficial do MySQL",
      ordem: 1,
      subjectId: 3
    }
  ];

  const filteredContents = selectedSubject && selectedSubject !== 'all' ? contents : mockContents;

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />;
      case 'ebook':
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'link':
        return <ExternalLink className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getContentBadge = (tipo: string) => {
    switch (tipo) {
      case 'video':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'ebook':
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'link':
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aulas e Conteúdos</h1>
          <p className="text-muted-foreground">
            Adição e gerenciamento de vídeo-aulas, e-books e links úteis
          </p>
        </div>
        <Button 
          onClick={() => setActiveTab("adicionar")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Conteúdo
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-600">Vídeo-aulas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-gray-600">E-books</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ExternalLink className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-gray-600">Links Úteis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">26</p>
                <p className="text-sm text-gray-600">Total Conteúdos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="listar">Listar Conteúdos</TabsTrigger>
          <TabsTrigger value="adicionar">Adicionar Conteúdo</TabsTrigger>
        </TabsList>

        <TabsContent value="listar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtrar por Disciplina</CardTitle>
              <CardDescription>Selecione uma disciplina para visualizar seus conteúdos</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder={subjectsLoading ? "Carregando..." : "Todas as disciplinas"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.codigo} - {subject.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content: any) => (
              <Card key={content.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getContentIcon(content.tipo)}
                      <CardTitle className="text-lg">{content.titulo}</CardTitle>
                    </div>
                    <Badge className={getContentBadge(content.tipo)}>
                      {content.tipo.charAt(0).toUpperCase() + content.tipo.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{content.descricao}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{content.url || content.conteudo}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">Ordem: {content.ordem}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditContent(content)}
                        title="Editar conteúdo"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteContent(content.id)}
                        title="Excluir conteúdo"
                        className="hover:bg-red-50 hover:border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="adicionar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingContent ? 'Editar Conteúdo' : 'Adicionar Novo Conteúdo'}
              </CardTitle>
              <CardDescription>
                {editingContent 
                  ? 'Atualize as informações do conteúdo selecionado' 
                  : 'Adicione vídeo-aulas, e-books ou links úteis às suas disciplinas'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select 
                    value={formData.subjectId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                    disabled={subjectsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={subjectsLoading ? "Carregando..." : "Selecione uma disciplina"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.codigo} - {subject.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conteúdo</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo-aula (YouTube/Drive)</SelectItem>
                      <SelectItem value="ebook">E-book/Apostila</SelectItem>
                      <SelectItem value="link">Link Útil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Conteúdo</Label>
                <Input 
                  id="titulo" 
                  placeholder="Ex: Introdução aos Algoritmos"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL/Link</Label>
                <Input 
                  id="url" 
                  placeholder="Ex: https://youtube.com/watch?v=... ou https://drive.google.com/..." 
                  value={formData.conteudo}
                  onChange={(e) => setFormData(prev => ({ ...prev, conteudo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao" 
                  placeholder="Descreva o conteúdo e sua importância para a disciplina"
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input 
                    id="ordem" 
                    type="number" 
                    placeholder="1" 
                    min="1"
                    value={formData.ordem}
                    onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleCreateContent}
                  disabled={createContentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createContentMutation.isPending ? 'Criando...' : (editingContent ? 'Salvar Alterações' : 'Adicionar Conteúdo')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingContent(null);
                  setFormData({
                    subjectId: "",
                    titulo: "",
                    tipo: "",
                    conteudo: "",
                    descricao: "",
                    ordem: 1
                  });
                  setActiveTab("listar");
                }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteContentId !== null}
        onOpenChange={(open) => !open && setDeleteContentId(null)}
        onConfirm={confirmDeleteContent}
        isLoading={deleteContentMutation.isPending}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita."
        entityName="conteúdo"
      />
    </div>
  );
}