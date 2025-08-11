import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  FileText, 
  Download,
  Eye,
  Plus,
  Clock,
  Users
} from "lucide-react";

export default function ConteudosFixed() {
  const [selectedDisciplina, setSelectedDisciplina] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    disciplina: "",
    tipo: "",
    descricao: "",
    duracao: "",
    arquivo: null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log("Novo conteúdo:", formData);
    setIsModalOpen(false);
    setFormData({
      titulo: "",
      disciplina: "",
      tipo: "",
      descricao: "",
      duracao: "",
      arquivo: null
    });
  };

  // Mock data para conteúdos
  const conteudos = [
    {
      id: 1,
      titulo: "Introdução aos Algoritmos",
      disciplina: "Algoritmos e Programação I",
      tipo: "video",
      duracao: "45 min",
      visualizacoes: 342,
      status: "publicado",
      dataPublicacao: "2024-01-15"
    },
    {
      id: 2,
      titulo: "Estruturas de Repetição",
      disciplina: "Algoritmos e Programação I",
      tipo: "documento",
      duracao: "30 min",
      visualizacoes: 285,
      status: "rascunho",
      dataPublicacao: null
    },
    {
      id: 3,
      titulo: "Banco de Dados Relacionais",
      disciplina: "Banco de Dados",
      tipo: "video",
      duracao: "60 min",
      visualizacoes: 428,
      status: "publicado",
      dataPublicacao: "2024-01-10"
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === "publicado") {
      return <Badge className="bg-green-100 text-green-800">Publicado</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === "video") {
      return <Video className="h-4 w-4 text-blue-600" />;
    }
    return <FileText className="h-4 w-4 text-green-600" />;
  };

  const conteudosFiltrados = selectedDisciplina === "todos" 
    ? conteudos 
    : conteudos.filter(c => c.disciplina === selectedDisciplina);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdos</h1>
          <p className="text-gray-600">Gerencie vídeos, documentos e materiais didáticos</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Conteúdo</DialogTitle>
              <DialogDescription>
                Adicione um novo material didático para suas disciplinas
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Conteúdo</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange("titulo", e.target.value)}
                  placeholder="Ex: Introdução aos Algoritmos"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select onValueChange={(value) => handleInputChange("disciplina", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="algoritmos">Algoritmos e Programação I</SelectItem>
                      <SelectItem value="estruturas">Estruturas de Dados</SelectItem>
                      <SelectItem value="banco">Banco de Dados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conteúdo</Label>
                  <Select onValueChange={(value) => handleInputChange("tipo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo Aula</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="apresentacao">Apresentação</SelectItem>
                      <SelectItem value="exercicio">Lista de Exercícios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  placeholder="Descreva o conteúdo..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração Estimada</Label>
                <Input
                  id="duracao"
                  value={formData.duracao}
                  onChange={(e) => handleInputChange("duracao", e.target.value)}
                  placeholder="Ex: 45 min"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                Criar Conteúdo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrar por disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Disciplinas</SelectItem>
            <SelectItem value="Algoritmos e Programação I">Algoritmos e Programação I</SelectItem>
            <SelectItem value="Estruturas de Dados">Estruturas de Dados</SelectItem>
            <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Conteúdos */}
      <div className="grid gap-6">
        {conteudosFiltrados.map((conteudo) => (
          <Card key={conteudo.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getTipoIcon(conteudo.tipo)}
                  <div>
                    <CardTitle className="text-lg font-semibold">{conteudo.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {conteudo.disciplina}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(conteudo.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{conteudo.duracao}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{conteudo.visualizacoes} visualizações</span>
                  </div>
                  {conteudo.dataPublicacao && (
                    <div>
                      Publicado em {new Date(conteudo.dataPublicacao).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {conteudosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Video className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum conteúdo encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Comece criando seu primeiro material didático.</p>
          <div className="mt-6">
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Conteúdo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}