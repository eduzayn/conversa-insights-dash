import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Video, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProfessorDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/professor/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalDisciplinas: 3,
    totalConteudos: 24,
    totalAvaliacoes: 8,
    totalAlunos: 156,
    avaliacoesPendentes: 5,
    interacoesRecentes: 23,
  };

  const recentActivities = dashboardData?.recentActivities || [
    {
      id: 1,
      type: "avaliacao",
      title: "Nova submissão em Algoritmos I",
      student: "Maria Silva",
      time: "há 5 minutos",
      status: "pendente"
    },
    {
      id: 2,
      type: "conteudo",
      title: "Aula sobre Estruturas de Dados visualizada",
      student: "João Santos",
      time: "há 15 minutos",
      status: "visualizado"
    },
    {
      id: 3,
      type: "avaliacao",
      title: "Prova P1 corrigida automaticamente",
      student: "Sistema",
      time: "há 1 hora",
      status: "concluido"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel Geral</h1>
        <p className="text-gray-600 mt-2">
          Visão geral das suas disciplinas, conteúdos e interações com alunos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDisciplinas}</div>
            <p className="text-xs text-muted-foreground">
              Ministrando atualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteúdos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConteudos}</div>
            <p className="text-xs text-muted-foreground">
              Vídeos, e-books e materiais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAvaliacoes}</div>
            <p className="text-xs text-muted-foreground">
              Provas e simulados criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlunos}</div>
            <p className="text-xs text-muted-foreground">
              Matriculados nas disciplinas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pendências
            </CardTitle>
            <CardDescription>
              Ações que precisam da sua atenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Avaliações para corrigir</p>
                <p className="text-sm text-gray-600">{stats.avaliacoesPendentes} submissões</p>
              </div>
              <Button size="sm">Ver todas</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Conteúdos a revisar</p>
                <p className="text-sm text-gray-600">2 materiais novos</p>
              </div>
              <Button size="sm" variant="outline">Revisar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas interações dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'pendente' ? 'bg-orange-500' :
                    activity.status === 'visualizado' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.student} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Desempenho das Disciplinas
          </CardTitle>
          <CardDescription>
            Progresso médio dos alunos por disciplina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { nome: "Algoritmos e Programação I", progresso: 78, alunos: 45 },
              { nome: "Estruturas de Dados", progresso: 65, alunos: 38 },
              { nome: "Banco de Dados", progresso: 82, alunos: 73 },
            ].map((disciplina, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{disciplina.nome}</p>
                    <p className="text-sm text-gray-600">{disciplina.alunos} alunos</p>
                  </div>
                  <span className="text-sm font-medium">{disciplina.progresso}%</span>
                </div>
                <Progress value={disciplina.progresso} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às funções mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-16 flex-col gap-2" variant="outline">
              <Video className="h-5 w-5" />
              <span className="text-xs">Adicionar Vídeo</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <FileText className="h-5 w-5" />
              <span className="text-xs">Criar Avaliação</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Novo E-book</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs">Corrigir Provas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}