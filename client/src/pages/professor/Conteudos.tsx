import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Video, 
  BookOpen, 
  Link2, 
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Search
} from "lucide-react";

export default function Conteudos() {
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [contentType, setContentType] = useState<"video" | "ebook" | "link" | "pdf">("video");

  const { data: conteudos, isLoading } = useQuery({
    queryKey: ["/api/professor/contents", selectedDisciplina],
  });

  const { data: disciplinas } = useQuery({
    queryKey: ["/api/professor/subjects"],
  });

  const mockConteudos = conteudos || [
    {
      id: 1,
      titulo: "Introdução aos Algoritmos",
      tipo: "video",
      conteudo: "https://youtube.com/watch?v=abc123",
      descricao: "Conceitos fundamentais de algoritmos e sua importância na programação",
      disciplina: "Algoritmos e Programação I",
      visualizacoes: 142,
      ordem: 1,
      createdAt: "2024-01-15",
      isActive: true
    },
    {
      id: 2,
      titulo: "E-book: Estruturas de Controle",
      tipo: "ebook",
      conteudo: "https://drive.google.com/file/d/xyz789",
      descricao: "Material completo sobre estruturas condicionais e de repetição",
      disciplina: "Algoritmos e Programação I",
      visualizacoes: 98,
      ordem: 2,
      createdAt: "2024-01-20",
      isActive: true
    },
    {
      id: 3,
      titulo: "Documentação Oficial Python",
      tipo: "link",
      conteudo: "https://docs.python.org/3/",
      descricao: "Link para a documentação oficial da linguagem Python",
      disciplina: "Algoritmos e Programação I",
      visualizacoes: 67,
      ordem: 3,
      createdAt: "2024-01-25",
      isActive: true
    },
    {
      id: 4,
      titulo: "Árvores Binárias - Conceitos",
      tipo: "video",
      conteudo: "https://youtube.com/watch?v=def456",
      descricao: "Explicação detalhada sobre árvores binárias e suas aplicações",
      disciplina: "Estruturas de Dados",
      visualizacoes: 89,
      ordem: 1,
      createdAt: "2024-02-01",
      isActive: true
    }
  ];

  const mockDisciplinas = disciplinas || [
    { id: 1, nome: "Algoritmos e Programação I" },
    { id: 2, nome: "Estruturas de Dados" },
    { id: 3, nome: "Banco de Dados" }
  ];

  const filteredConteudos = mockConteudos.filter(conteudo => {
    const matchesDisciplina = selectedDisciplina === "all" || conteudo.disciplina === selectedDisciplina;
    const matchesSearch = conteudo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conteudo.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDisciplina && matchesSearch;
  });

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video className="h-4 w-4" />;
      case "ebook": return <BookOpen className="h-4 w-4" />;
      case "link": return <Link2 className="h-4 w-4" />;
      case "pdf": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "video": return "bg-red-100 text-red-800";
      case "ebook": return "bg-blue-100 text-blue-800";
      case "link": return "bg-green-100 text-green-800";
      case "pdf": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddContent = () => {
    // Implementar lógica de adição
    setIsAddingContent(false);
    console.log("Conteúdo adicionado");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aulas e Conteúdos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie vídeo-aulas, e-books e materiais complementares
          </p>
        </div>
        <Dialog open={isAddingContent} onOpenChange={setIsAddingContent}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Conteúdo</DialogTitle>
              <DialogDescription>
                Adicione vídeos, e-books ou links complementares às suas disciplinas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDisciplinas.map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.nome}>
                          {disciplina.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conteúdo</Label>
                  <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo (YouTube/Drive)</SelectItem>
                      <SelectItem value="ebook">E-book/PDF</SelectItem>
                      <SelectItem value="link">Link Externo</SelectItem>
                      <SelectItem value="pdf">Arquivo PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Conteúdo</Label>
                <Input placeholder="Digite o título do conteúdo" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">
                  {contentType === "video" ? "Link do YouTube ou Google Drive" :
                   contentType === "ebook" ? "Link do E-book ou Google Drive" :
                   contentType === "link" ? "URL do Link" :
                   "Arquivo PDF"}
                </Label>
                {contentType === "pdf" ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Clique para fazer upload do arquivo PDF</p>
                  </div>
                ) : (
                  <Input placeholder={
                    contentType === "video" ? "https://youtube.com/watch?v=..." :
                    contentType === "ebook" ? "https://drive.google.com/file/d/..." :
                    "https://exemplo.com"
                  } />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  placeholder="Descreva o conteúdo e seu objetivo de aprendizagem"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem na Disciplina</Label>
                <Input type="number" placeholder="1" defaultValue="1" />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddingContent(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddContent}>
                  Adicionar Conteúdo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conteúdos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as disciplinas</SelectItem>
            {mockDisciplinas.map((disciplina) => (
              <SelectItem key={disciplina.id} value={disciplina.nome}>
                {disciplina.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockConteudos.filter(c => c.tipo === "video").length}
                </p>
                <p className="text-sm text-gray-600">Vídeos</p>
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
                <p className="text-2xl font-bold">
                  {mockConteudos.filter(c => c.tipo === "ebook").length}
                </p>
                <p className="text-sm text-gray-600">E-books</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Link2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockConteudos.filter(c => c.tipo === "link").length}
                </p>
                <p className="text-sm text-gray-600">Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockConteudos.reduce((sum, c) => sum + c.visualizacoes, 0)}
                </p>
                <p className="text-sm text-gray-600">Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConteudos.map((conteudo) => (
          <Card key={conteudo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(conteudo.tipo)}
                  <Badge className={getTypeBadgeColor(conteudo.tipo)}>
                    {conteudo.tipo === "video" ? "Vídeo" :
                     conteudo.tipo === "ebook" ? "E-book" :
                     conteudo.tipo === "link" ? "Link" : "PDF"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg leading-tight">{conteudo.titulo}</CardTitle>
              <CardDescription className="text-sm text-blue-600">
                {conteudo.disciplina}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {conteudo.descricao}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Eye className="h-3 w-3" />
                  <span>{conteudo.visualizacoes} visualizações</span>
                </div>
                <span className="text-gray-500">Ordem: {conteudo.ordem}</span>
              </div>

              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  Ver Conteúdo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConteudos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum conteúdo encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedDisciplina !== "all" 
                ? "Tente ajustar os filtros para encontrar conteúdos"
                : "Comece criando seu primeiro conteúdo educacional"
              }
            </p>
            <Button onClick={() => setIsAddingContent(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}