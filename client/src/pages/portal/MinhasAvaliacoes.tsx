import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, BookOpen, TrendingUp, Award } from "lucide-react";

interface Evaluation {
  id: number;
  enrollment: {
    course: {
      nome: string;
      modalidade: string;
    };
  };
  tipoAvaliacao: string;
  titulo: string;
  nota?: number;
  notaMaxima: number;
  status: string;
  dataAvaliacao?: string;
  feedback?: string;
  tentativasRestantes?: number;
}

export default function MinhasAvaliacoes() {
  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/avaliacoes'],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: [],
    placeholderData: []
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'aprovado': { variant: 'default' as const, label: 'Aprovado', color: 'text-green-700 bg-green-100' },
      'reprovado': { variant: 'destructive' as const, label: 'Reprovado', color: 'text-red-700 bg-red-100' },
      'pendente': { variant: 'outline' as const, label: 'Pendente', color: 'text-yellow-700 bg-yellow-100' },
      'em_correcao': { variant: 'secondary' as const, label: 'Em Correção', color: 'text-blue-700 bg-blue-100' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, color: 'text-gray-700 bg-gray-100' };
  };

  const getNotaColor = (nota: number, notaMaxima: number) => {
    const percentage = (nota / notaMaxima) * 100;
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const groupedEvaluations = evaluations.reduce((acc: any, evaluation: Evaluation) => {
    const courseName = evaluation.enrollment.course.nome;
    if (!acc[courseName]) {
      acc[courseName] = [];
    }
    acc[courseName].push(evaluation);
    return acc;
  }, {});

  const statsData = {
    total: evaluations.length,
    aprovadas: evaluations.filter((e: Evaluation) => e.status === 'aprovado').length,
    pendentes: evaluations.filter((e: Evaluation) => e.status === 'pendente').length,
    mediaGeral: evaluations.length > 0 
      ? evaluations
          .filter((e: Evaluation) => e.nota !== undefined)
          .reduce((sum: number, e: Evaluation) => sum + (e.nota || 0), 0) / 
        evaluations.filter((e: Evaluation) => e.nota !== undefined).length
      : 0
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Avaliações</h1>
        <p className="text-gray-600">Acompanhe suas notas, feedback dos tutores e desempenho acadêmico</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Avaliações</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">{statsData.aprovadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{statsData.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Média Geral</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statsData.mediaGeral.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avaliações por curso */}
      {Object.keys(groupedEvaluations).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-500 text-center">
              Você ainda não possui avaliações registradas em seus cursos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={Object.keys(groupedEvaluations)[0]} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            {Object.keys(groupedEvaluations).slice(0, 3).map((courseName) => (
              <TabsTrigger key={courseName} value={courseName} className="text-xs">
                {courseName.length > 30 ? `${courseName.substring(0, 30)}...` : courseName}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedEvaluations).map(([courseName, courseEvaluations]: [string, any]) => (
            <TabsContent key={courseName} value={courseName} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{courseName}</CardTitle>
                  <CardDescription>
                    {(courseEvaluations[0] as Evaluation).enrollment.course.modalidade}
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                {(courseEvaluations as Evaluation[]).map((evaluation) => {
                  const statusBadge = getStatusBadge(evaluation.status);
                  
                  return (
                    <Card key={evaluation.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{evaluation.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              {evaluation.tipoAvaliacao}
                              {evaluation.dataAvaliacao && (
                                <> • {new Date(evaluation.dataAvaliacao).toLocaleDateString('pt-BR')}</>
                              )}
                            </CardDescription>
                          </div>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {evaluation.nota !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Nota:</span>
                            <span className={`text-lg font-semibold ${getNotaColor(evaluation.nota, evaluation.notaMaxima)}`}>
                              {evaluation.nota.toFixed(1)} / {evaluation.notaMaxima}
                            </span>
                          </div>
                        )}

                        {evaluation.tentativasRestantes !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tentativas restantes:</span>
                            <span className="text-sm font-medium">{evaluation.tentativasRestantes}</span>
                          </div>
                        )}

                        {evaluation.feedback && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-gray-700 mb-1">Feedback do tutor:</p>
                            <p className="text-sm text-gray-600">{evaluation.feedback}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}