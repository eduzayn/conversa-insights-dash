import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Clock, CheckCircle } from "lucide-react";

interface Enrollment {
  id: number;
  course: {
    nome: string;
    modalidade: string;
    cargaHoraria: number;
  };
  status: string;
  progresso: number;
  dataMatricula: string;
  dataInicio?: string;
  linkPlataforma?: string;
  horasCompletadas?: number;
}

export default function MeusCursos() {
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/cursos'],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: [],
    placeholderData: []
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativa': { variant: 'default' as const, label: 'Ativa' },
      'concluida': { variant: 'secondary' as const, label: 'Concluída' },
      'cancelada': { variant: 'destructive' as const, label: 'Cancelada' },
      'trancada': { variant: 'outline' as const, label: 'Trancada' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meus Cursos</h1>
        <p className="text-gray-600">Acompanhe o progresso dos seus cursos matriculados</p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso encontrado</h3>
            <p className="text-gray-500 text-center">
              Você ainda não possui matrículas ativas. Entre em contato com a secretaria para mais informações.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {enrollments.map((enrollment: Enrollment) => {
            const statusBadge = getStatusBadge(enrollment.status);
            const horasCompletadas = enrollment.horasCompletadas || Math.floor((enrollment.progresso / 100) * enrollment.course.cargaHoraria);
            
            return (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{enrollment.course.nome}</CardTitle>
                      <CardDescription className="mt-1">
                        {enrollment.course.modalidade} • {enrollment.course.cargaHoraria}h
                      </CardDescription>
                    </div>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progresso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progresso do curso</span>
                      <span className="font-medium">{enrollment.progresso}%</span>
                    </div>
                    <Progress 
                      value={enrollment.progresso} 
                      className="h-2"
                    />
                  </div>

                  {/* Informações adicionais */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {horasCompletadas}h de {enrollment.course.cargaHoraria}h
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Matrícula: {new Date(enrollment.dataMatricula).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  {enrollment.status === 'ativa' && (
                    <div className="flex gap-2 pt-2">
                      {enrollment.linkPlataforma && (
                        <Button 
                          size="sm" 
                          onClick={() => window.open(enrollment.linkPlataforma, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Acessar Plataforma
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}