import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Award,
  FileText,
  AlertCircle,
  Target
} from "lucide-react";

interface StudentData {
  name: string;
  email: string;
  cpf: string;
  matriculaAtiva: boolean;
}

interface StudentEnrollment {
  id: number;
  nomeCurso: string;
  modalidade: string;
  dataMatricula: string;
  statusMatricula: string;
  progresso: number;
  cargaHoraria: number;
  horasCompletadas: number;
}

interface StudentDashboardProps {
  studentData: StudentData;
}

export function StudentDashboard({ studentData }: StudentDashboardProps) {
  // Simulando dados até a API estar disponível
  const enrollments: StudentEnrollment[] = [
    {
      id: 1,
      nomeCurso: "Pós-Graduação em Gestão Escolar",
      modalidade: "Pós-Graduação",
      dataMatricula: "2024-03-15",
      statusMatricula: "ativa",
      progresso: 75,
      cargaHoraria: 420,
      horasCompletadas: 315
    },
    {
      id: 2,
      nomeCurso: "Segunda Licenciatura em Matemática",
      modalidade: "Segunda Licenciatura",
      dataMatricula: "2024-02-01",
      statusMatricula: "ativa",
      progresso: 45,
      cargaHoraria: 1320,
      horasCompletadas: 594
    }
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const activeCourses = enrollments.filter(e => e.statusMatricula === 'ativa');
  const averageProgress = activeCourses.length > 0 
    ? Math.round(activeCourses.reduce((acc, e) => acc + e.progresso, 0) / activeCourses.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Olá, {studentData.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 mb-4">
              Seja bem-vindo ao seu painel de estudos
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${studentData.matriculaAtiva ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Matrícula {studentData.matriculaAtiva ? 'Ativa' : 'Inativa'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <GraduationCap className="h-12 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Cursos Ativos</p>
                <p className="text-2xl font-bold text-blue-900">{activeCourses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Progresso Médio</p>
                <p className="text-2xl font-bold text-green-900">{averageProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Horas Completadas</p>
                <p className="text-2xl font-bold text-purple-900">
                  {activeCourses.reduce((acc, e) => acc + e.horasCompletadas, 0)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Documentação</p>
                <p className="text-2xl font-bold text-orange-900">
                  {studentData.matriculaAtiva ? 'OK' : 'Pendente'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meus Cursos */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Meus Cursos</span>
            </CardTitle>
            <CardDescription>Acompanhe o progresso dos seus estudos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCourses.map((course) => (
              <div key={course.id} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{course.nomeCurso}</h4>
                    <p className="text-sm text-gray-500">{course.modalidade}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {course.progresso}%
                  </Badge>
                </div>
                
                <Progress value={course.progresso} className="h-2" />
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{course.horasCompletadas}h de {course.cargaHoraria}h</span>
                  <span>Matrícula: {new Date(course.dataMatricula).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
            
            {activeCourses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum curso ativo encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Ações Rápidas</span>
            </CardTitle>
            <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700" asChild>
              <a href="/portal/avaliacoes">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Avaliações Pendentes
              </a>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/portal/documentos">
                <FileText className="h-4 w-4 mr-2" />
                Enviar Documentos
              </a>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/portal/pagamentos">
                <Clock className="h-4 w-4 mr-2" />
                Verificar Financeiro
              </a>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/portal/carteirinha">
                <Award className="h-4 w-4 mr-2" />
                Gerar Carteirinha
              </a>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/portal/suporte">
                <AlertCircle className="h-4 w-4 mr-2" />
                Solicitar Suporte
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>Atividades Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Avaliação completada</p>
                <p className="text-xs text-gray-500">Gestão Escolar - Módulo 3 • Há 2 dias</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Documento aprovado</p>
                <p className="text-xs text-gray-500">Histórico escolar • Há 5 dias</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Certificado disponível</p>
                <p className="text-xs text-gray-500">Curso de Capacitação • Há 1 semana</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}