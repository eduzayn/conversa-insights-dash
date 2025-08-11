import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/utils/FileUpload";
import { FileText, Video, BookOpen, Plus, ExternalLink, Edit, Trash2, Upload } from "lucide-react";

export default function Conteudos() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [activeTab, setActiveTab] = useState("listar");
  const [editingContent, setEditingContent] = useState<any>(null);

  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setActiveTab("adicionar");
  };

  const handleDeleteContent = (contentId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este conteúdo?")) {
      console.log("Excluindo conteúdo:", contentId);
      // Aqui seria feita a chamada para a API para deletar
    }
  };

  // Dados mock das disciplinas do professor
  const subjects = [
    { id: 1, nome: "Algoritmos e Estruturas de Dados I", codigo: "AED001" },
    { id: 2, nome: "Programação Orientada a Objetos", codigo: "POO001" },
    { id: 3, nome: "Banco de Dados", codigo: "BD001" }
  ];

  // Dados mock dos conteúdos
  const contents = [
    {
      id: 1,
      titulo: "Introdução aos Algoritmos",
      tipo: "video",
      url: "https://youtube.com/watch?v=abc123",
      descricao: "Conceitos básicos de algoritmos e complexidade",
      ordem: 1,
      subjectId: 1
    },
    {
      id: 2,
      titulo: "Apostila de Estruturas de Dados",
      tipo: "ebook",
      url: "https://drive.google.com/file/d/xyz789",
      descricao: "Material complementar sobre listas, pilhas e filas",
      ordem: 2,
      subjectId: 1
    },
    {
      id: 3,
      titulo: "Exercícios de POO",
      tipo: "link",
      url: "https://example.com/exercicios",
      descricao: "Lista de exercícios práticos",
      ordem: 1,
      subjectId: 2
    }
  ];

  const filteredContents = selectedSubject && selectedSubject !== "all"
    ? contents.filter(content => content.subjectId === parseInt(selectedSubject))
    : contents;

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video className="h-4 w-4" />;
      case "ebook": return <BookOpen className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getContentBadge = (tipo: string) => {
    const variants = {
      video: "bg-red-100 text-red-800",
      ebook: "bg-blue-100 text-blue-800",
      link: "bg-green-100 text-green-800"
    };
    return variants[tipo as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aulas e Conteúdos</h1>
          <p className="text-gray-600 mt-2">Adição e gerenciamento de vídeo-aulas, e-books e links úteis</p>
        </div>
        <Button className="gap-2" onClick={() => setActiveTab("adicionar")}>
          <Plus className="h-4 w-4" />
          Adicionar Conteúdo
        </Button>
      </div>

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
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.codigo} - {subject.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map(content => (
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
                    <span className="truncate">{content.url}</span>
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
                  <Select defaultValue={editingContent?.subjectId?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.codigo} - {subject.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conteúdo</Label>
                  <Select defaultValue={editingContent?.tipo}>
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
                  defaultValue={editingContent?.titulo || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL/Link</Label>
                <Input 
                  id="url" 
                  placeholder="Ex: https://youtube.com/watch?v=... ou https://drive.google.com/..." 
                  defaultValue={editingContent?.url || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao" 
                  placeholder="Descreva o conteúdo e sua importância para a disciplina"
                  rows={3}
                  defaultValue={editingContent?.descricao || ""}
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
                    defaultValue={editingContent?.ordem || ""}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={() => {
                  console.log(editingContent ? "Salvando alterações..." : "Adicionando novo conteúdo...");
                  setEditingContent(null);
                  setActiveTab("listar");
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingContent ? 'Salvar Alterações' : 'Adicionar Conteúdo'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingContent(null);
                  setActiveTab("listar");
                }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}