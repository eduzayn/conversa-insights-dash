import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { NotificationSystem } from "@/components/NotificationSystem";
import { 
  BookOpen, 
  Video, 
  Link2, 
  FileText, 
  Clock, 
  User, 
  Play,
  ExternalLink,
  CheckCircle,
  Calendar,
  BarChart3,
  QrCode,
  Bell
} from "lucide-react";

interface SubjectContent {
  id: number;
  titulo: string;
  tipo: "video" | "ebook" | "link" | "pdf";
  conteudo: string;
  descricao: string;
  ordem: number;
  professorNome: string;
  createdAt: string;
  visualizado: boolean;
}

interface SubjectEvaluation {
  id: number;
  titulo: string;
  tipo: "prova" | "simulado" | "tarefa";
  descricao: string;
  dataAbertura: string;
  dataFechamento: string;
  tentativasPermitidas: number;
  tempoLimite: number;
  status: "disponivel" | "realizada" | "expirada";
  nota?: number;
  professorNome: string;
}

interface StudentSubject {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  professorNome: string;
  cargaHoraria: number;
  area: string;
  progresso: number;
  conteudos: SubjectContent[];
  avaliacoes: SubjectEvaluation[];
}

export default function MinhasDisciplinas() {
  const [selectedSubject, setSelectedSubject] = useState<StudentSubject | null>(null);
  const [showQRCode, setShowQRCode] = useState<StudentSubject | null>(null);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["/api/portal/aluno/disciplinas"],
  });

  // Dados mock integrados com Portal do Professor
  const mockSubjects: StudentSubject[] = subjects || [
    {
      id: 1,
      nome: "Algoritmos e Estruturas de Dados I",
      codigo: "AED001",
      descricao: "Introdução aos conceitos fundamentais de algoritmos e estruturas de dados",
      professorNome: "Prof. João Silva",
      cargaHoraria: 80,
      area: "Ciência da Computação",
      progresso: 65,
      conteudos: [
        {
          id: 1,
          titulo: "Introdução aos Algoritmos",
          tipo: "video",
          conteudo: "https://youtube.com/watch?v=abc123",
          descricao: "Conceitos básicos de algoritmos e complexidade",
          ordem: 1,
          professorNome: "Prof. João Silva",
          createdAt: "2025-01-15",
          visualizado: true
        },
        {
          id: 2,
          titulo: "Apostila de Estruturas de Dados",
          tipo: "ebook",
          conteudo: "https://drive.google.com/file/d/xyz789",
          descricao: "Material complementar sobre listas, pilhas e filas",
          ordem: 2,
          professorNome: "Prof. João Silva",
          createdAt: "2025-01-20",
          visualizado: false
        }
      ],
      avaliacoes: [
        {
          id: 1,
          titulo: "Prova 1 - Algoritmos Básicos",
          tipo: "prova",
          descricao: "Avaliação sobre conceitos fundamentais de algoritmos",
          dataAbertura: "2025-01-15",
          dataFechamento: "2025-01-20",
          tentativasPermitidas: 1,
          tempoLimite: 120,
          status: "disponivel",
          professorNome: "Prof. João Silva"
        }
      ]
    },
    {
      id: 2,
      nome: "Programação Orientada a Objetos",
      codigo: "POO001",
      descricao: "Conceitos e práticas de programação orientada a objetos",
      professorNome: "Prof. João Silva",
      cargaHoraria: 60,
      area: "Ciência da Computação",
      progresso: 40,
      conteudos: [
        {
          id: 3,
          titulo: "Exercícios de POO",
          tipo: "link",
          conteudo: "https://example.com/exercicios",
          descricao: "Lista de exercícios práticos",
          ordem: 1,
          professorNome: "Prof. João Silva",
          createdAt: "2025-01-25",
          visualizado: false
        }
      ],
      avaliacoes: []
    }
  ];

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video className="h-4 w-4 text-red-600" />;
      case "ebook": return <BookOpen className="h-4 w-4 text-blue-600" />;
      case "link": return <Link2 className="h-4 w-4 text-green-600" />;
      case "pdf": return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getContentBadge = (tipo: string) => {
    const variants = {
      video: "bg-red-100 text-red-800",
      ebook: "bg-blue-100 text-blue-800", 
      link: "bg-green-100 text-green-800",
      pdf: "bg-purple-100 text-purple-800"
    };
    return variants[tipo as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  const getEvaluationBadge = (status: string) => {
    const variants = {
      disponivel: "bg-green-100 text-green-800",
      realizada: "bg-blue-100 text-blue-800",
      expirada: "bg-gray-100 text-gray-800"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sistema de Notificações */}
      <NotificationSystem studentId={1} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Disciplinas</h1>
          <p className="text-gray-600 mt-2">Acesse os conteúdos e avaliações das suas disciplinas</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-blue-600">Notificações ativas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSubjects.map(subject => (
          <Card key={subject.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{subject.nome}</CardTitle>
                  <CardDescription className="text-sm text-blue-600 font-medium">
                    {subject.codigo}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {subject.cargaHoraria}h
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {subject.descricao}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-3 w-3" />
                <span>{subject.professorNome}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-medium">{subject.progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${subject.progresso}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-lg">{subject.conteudos.length}</p>
                  <p className="text-gray-600">Conteúdos</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">{subject.avaliacoes.length}</p>
                  <p className="text-gray-600">Avaliações</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex-1" 
                      onClick={() => setSelectedSubject(subject)}
                    >
                      Acessar Disciplina
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {subject.nome}
                    </DialogTitle>
                    <DialogDescription>
                      {subject.codigo} - {subject.professorNome}
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="conteudos" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
                      <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                    </TabsList>

                    <TabsContent value="conteudos" className="space-y-4">
                      {subject.conteudos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Nenhum conteúdo disponível ainda</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {subject.conteudos.map(content => (
                            <Card key={content.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    {getContentIcon(content.tipo)}
                                    <div>
                                      <CardTitle className="text-base">{content.titulo}</CardTitle>
                                      <CardDescription className="text-sm">
                                        Ordem: {content.ordem} • {new Date(content.createdAt).toLocaleDateString()}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {content.visualizado && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    <Badge className={getContentBadge(content.tipo)}>
                                      {content.tipo.charAt(0).toUpperCase() + content.tipo.slice(1)}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <p className="text-sm text-gray-600">{content.descricao}</p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="truncate max-w-64">{content.conteudo}</span>
                                  </div>
                                  <Button size="sm" variant="outline">
                                    <Play className="h-3 w-3 mr-1" />
                                    Acessar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="avaliacoes" className="space-y-4">
                      {subject.avaliacoes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Nenhuma avaliação disponível ainda</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {subject.avaliacoes.map(evaluation => (
                            <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{evaluation.titulo}</CardTitle>
                                    <CardDescription>{evaluation.descricao}</CardDescription>
                                  </div>
                                  <Badge className={getEvaluationBadge(evaluation.status)}>
                                    {evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-gray-500" />
                                    <span>Até: {new Date(evaluation.dataFechamento).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-gray-500" />
                                    <span>{evaluation.tempoLimite} min</span>
                                  </div>
                                </div>

                                {evaluation.nota && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-green-800">Nota Obtida:</span>
                                      <span className="text-lg font-bold text-green-800">{evaluation.nota}/10</span>
                                    </div>
                                  </div>
                                )}

                                <Button 
                                  className="w-full" 
                                  disabled={evaluation.status === "expirada"}
                                  variant={evaluation.status === "realizada" ? "outline" : "default"}
                                >
                                  {evaluation.status === "realizada" ? "Ver Resultado" : 
                                   evaluation.status === "expirada" ? "Expirada" : "Iniciar Avaliação"}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowQRCode(subject)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>QR Code - Acesso Rápido</DialogTitle>
                      <DialogDescription>
                        Use este QR Code para acessar rapidamente a disciplina {subject.nome}
                      </DialogDescription>
                    </DialogHeader>
                    <QRCodeGenerator
                      data={`${window.location.origin}/portal/disciplinas?id=${subject.id}`}
                      title={subject.nome}
                      description={`Acesso rápido à disciplina ${subject.codigo}`}
                      size={250}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}