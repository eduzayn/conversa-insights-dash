import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Users, 
  Clock, 
  FileText,
  Video,
  Plus,
  Settings,
  BarChart3
} from "lucide-react";

export default function DisciplinasFixed() {
  const navigate = useNavigate();
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    area: "",
    cargaHoraria: "",
    descricao: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Aqui seria feita a chamada para a API
    console.log("Nova disciplina:", formData);
    setIsModalOpen(false);
    setFormData({
      nome: "",
      codigo: "",
      area: "",
      cargaHoraria: "",
      descricao: ""
    });
  };

  // Lista das disciplinas do professor
  const disciplinas = [
    {
      id: 1,
      nome: "Algoritmos e Programação I",
      codigo: "PROG001",
      area: "Ciências Exatas",
      cargaHoraria: 80,
      totalAlunos: 45,
      totalConteudos: 12,
      totalAvaliacoes: 4,
      status: "ativa",
      progresso: 78
    },
    {
      id: 2,
      nome: "Estruturas de Dados",
      codigo: "PROG002", 
      area: "Ciências Exatas",
      cargaHoraria: 60,
      totalAlunos: 38,
      totalConteudos: 8,
      totalAvaliacoes: 3,
      status: "ativa",
      progresso: 65
    },
    {
      id: 3,
      nome: "Banco de Dados",
      codigo: "DB001",
      area: "Ciências Exatas", 
      cargaHoraria: 100,
      totalAlunos: 73,
      totalConteudos: 15,
      totalAvaliacoes: 5,
      status: "ativa",
      progresso: 82
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === "ativa") {
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Disciplinas</h1>
          <p className="text-gray-600">Gerencie suas disciplinas e acompanhe o progresso dos alunos</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Disciplina</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova disciplina que deseja criar
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Disciplina</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Ex: Algoritmos e Programação"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => handleInputChange("codigo", e.target.value)}
                    placeholder="Ex: PROG001"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Área</Label>
                  <Select onValueChange={(value) => handleInputChange("area", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ciencias-exatas">Ciências Exatas</SelectItem>
                      <SelectItem value="humanas">Ciências Humanas</SelectItem>
                      <SelectItem value="biologicas">Ciências Biológicas</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargaHoraria">Carga Horária</Label>
                  <Input
                    id="cargaHoraria"
                    type="number"
                    value={formData.cargaHoraria}
                    onChange={(e) => handleInputChange("cargaHoraria", e.target.value)}
                    placeholder="Ex: 80"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  placeholder="Descrição da disciplina..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                Criar Disciplina
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Disciplinas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {disciplinas.map((disciplina) => (
          <Card 
            key={disciplina.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedDisciplina === disciplina.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedDisciplina(disciplina.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold">{disciplina.nome}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    {disciplina.codigo} • {disciplina.area}
                  </CardDescription>
                </div>
                {getStatusBadge(disciplina.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso do Semestre</span>
                    <span className="font-medium">{disciplina.progresso}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(disciplina.progresso)}`}
                      style={{ width: `${disciplina.progresso}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-xs font-medium text-blue-600">ALUNOS</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">{disciplina.totalAlunos}</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <BookOpen className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-green-600">CONTEÚDOS</span>
                    </div>
                    <div className="text-lg font-bold text-green-900">{disciplina.totalConteudos}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <FileText className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-xs font-medium text-purple-600">AVALIAÇÕES</span>
                    </div>
                    <div className="text-lg font-bold text-purple-900">{disciplina.totalAvaliacoes}</div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-orange-600 mr-1" />
                      <span className="text-xs font-medium text-orange-600">CH TOTAL</span>
                    </div>
                    <div className="text-lg font-bold text-orange-900">{disciplina.cargaHoraria}h</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/professor/conteudos?disciplina=${disciplina.id}`);
                    }}
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Conteúdos
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/professor/avaliacoes?disciplina=${disciplina.id}`);
                    }}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Avaliar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Aqui abriria modal de configurações da disciplina
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disciplina Selecionada - Detalhes */}
      {selectedDisciplina && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Detalhes da Disciplina</CardTitle>
            <CardDescription>Informações detalhadas sobre a disciplina selecionada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Gerais</h3>
                {disciplinas
                  .filter(d => d.id === selectedDisciplina)
                  .map(disciplina => (
                    <div key={disciplina.id} className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nome</label>
                        <p className="font-medium">{disciplina.nome}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Código</label>
                        <p className="font-medium">{disciplina.codigo}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Área</label>
                        <p className="font-medium">{disciplina.area}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Carga Horária</label>
                        <p className="font-medium">{disciplina.cargaHoraria} horas</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Estatísticas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Estatísticas</h3>
                {disciplinas
                  .filter(d => d.id === selectedDisciplina)
                  .map(disciplina => (
                    <div key={disciplina.id} className="space-y-3">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-medium">Alunos Matriculados</span>
                          </div>
                          <span className="text-2xl font-bold text-blue-600">{disciplina.totalAlunos}</span>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <BookOpen className="h-5 w-5 text-green-600 mr-2" />
                            <span className="font-medium">Conteúdos Criados</span>
                          </div>
                          <span className="text-2xl font-bold text-green-600">{disciplina.totalConteudos}</span>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-purple-600 mr-2" />
                            <span className="font-medium">Avaliações</span>
                          </div>
                          <span className="text-2xl font-bold text-purple-600">{disciplina.totalAvaliacoes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Ações Rápidas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ações Rápidas</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/professor/conteudos?disciplina=${selectedDisciplina}`)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Gerenciar Conteúdos
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/professor/avaliacoes?disciplina=${selectedDisciplina}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Criar Avaliação
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/professor/submissoes?disciplina=${selectedDisciplina}`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Submissões
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/professor/relatorios?disciplina=${selectedDisciplina}`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Relatórios
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}