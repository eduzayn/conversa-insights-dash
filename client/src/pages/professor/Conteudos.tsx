import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Video, BookOpen, Link as LinkIcon, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import ContentForm from "@/components/professor/ContentForm";
import ContentCard from "@/components/professor/ContentCard";
import ContentModal from "@/components/professor/ContentModal";
import type { SubjectContent, Subject } from "@/types/professor";

interface ContentStats {
  total: number;
  videos: number;
  ebooks: number;
  links: number;
  pdfs: number;
}

export default function Conteudos() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewModalContent, setViewModalContent] = useState<SubjectContent | null>(null);
  const [editModalContent, setEditModalContent] = useState<SubjectContent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryClient = useQueryClient();

  // Buscar disciplinas do professor
  const { data: subjects = [], isLoading: subjectsLoading, error: subjectsError } = useQuery<Subject[]>({
    queryKey: ['professor', 'subjects'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/professor/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      return await response.json();
    },
  });

  // Buscar conteúdos
  const { data: contents = [], isLoading } = useQuery<SubjectContent[]>({
    queryKey: ['professor', 'contents', selectedSubjectId],
    enabled: selectedSubjectId !== null,
  });

  // Buscar todos os conteúdos para estatísticas
  const { data: allContents = [] } = useQuery<SubjectContent[]>({
    queryKey: ['professor', 'contents', 'all'],
  });

  // Mutation para deletar conteúdo
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/professor/contents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Erro ao deletar conteúdo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor', 'contents'] });
      toast({
        title: "Sucesso",
        description: "Conteúdo deletado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao deletar conteúdo.",
        variant: "destructive",
      });
    },
  });

  // Calcular estatísticas
  const stats: ContentStats = {
    total: allContents.length,
    videos: allContents.filter(c => c.tipo === 'video').length,
    ebooks: allContents.filter(c => c.tipo === 'ebook').length,
    links: allContents.filter(c => c.tipo === 'link').length,
    pdfs: allContents.filter(c => c.tipo === 'pdf').length,
  };

  // Filtrar conteúdos
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (content.descricao && content.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || content.tipo === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'ebook': return <BookOpen className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Vídeo-aulas';
      case 'ebook': return 'E-books';
      case 'link': return 'Links Úteis';
      case 'pdf': return 'PDFs';
      default: return 'Conteúdos';
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este conteúdo?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditModalContent(null);
    queryClient.invalidateQueries({ queryKey: ['professor', 'contents'] });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aulas e Conteúdos</h1>
          <p className="text-gray-600 mt-1">Adicione e gerencie vídeo-aulas, e-books e links úteis</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Conteúdo
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.videos}</p>
                <p className="text-sm text-gray-600">Vídeo-aulas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.ebooks}</p>
                <p className="text-sm text-gray-600">E-books</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <LinkIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.links}</p>
                <p className="text-sm text-gray-600">Links Úteis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Conteúdos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-gray-100 h-12">
          <TabsTrigger value="list" className="px-6 py-3">Listar Conteúdos</TabsTrigger>
          <TabsTrigger value="add" className="px-6 py-3">Adicionar Conteúdo</TabsTrigger>
        </TabsList>

        {/* Tab Listar Conteúdos */}
        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtrar por Disciplina</CardTitle>
              <CardDescription>Selecione uma disciplina para visualizar seus conteúdos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={selectedSubjectId?.toString() || "all"}
                  onValueChange={(value) => setSelectedSubjectId(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger>
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

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de conteúdo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="video">Vídeo-aulas</SelectItem>
                    <SelectItem value="ebook">E-books</SelectItem>
                    <SelectItem value="link">Links</SelectItem>
                    <SelectItem value="pdf">PDFs</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conteúdos */}
          {selectedSubjectId === null ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-2">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900">Selecione uma disciplina</h3>
                  <p className="text-gray-600">Escolha uma disciplina no filtro acima para visualizar seus conteúdos.</p>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum conteúdo encontrado</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedType !== 'all' 
                      ? 'Não há conteúdos que correspondam aos filtros aplicados.'
                      : 'Esta disciplina ainda não possui conteúdos. Clique em "Adicionar Conteúdo" para começar.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContents.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  subject={subjects.find(s => s.id === content.subjectId)}
                  onView={setViewModalContent}
                  onEdit={setEditModalContent}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Adicionar Conteúdo */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Novo Conteúdo</CardTitle>
              <CardDescription>Preencha as informações do novo conteúdo</CardDescription>
            </CardHeader>
            <CardContent>
              <ContentForm
                subjects={subjects}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowCreateForm(false)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {viewModalContent && (
        <ContentModal
          content={viewModalContent}
          subject={subjects.find(s => s.id === viewModalContent.subjectId)}
          isOpen={!!viewModalContent}
          onClose={() => setViewModalContent(null)}
        />
      )}

      {editModalContent && (
        <ContentForm
          subjects={subjects}
          initialData={editModalContent}
          onSuccess={handleFormSuccess}
          onCancel={() => setEditModalContent(null)}
          isModal={true}
        />
      )}
    </div>
  );
}