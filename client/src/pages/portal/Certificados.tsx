import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, QrCode, Eye } from "lucide-react";
import { toast } from "sonner";

interface Certificate {
  id: number;
  enrollment: {
    course: {
      nome: string;
      modalidade: string;
    };
  };
  tipoCertificado: string;
  titulo: string;
  status: string;
  urlDownload?: string;
  codigoVerificacao?: string;
  dataEmissao?: string;
  dataSolicitacao: string;
  validoAte?: string;
  observacoes?: string;
}

export default function Certificados() {
  const queryClient = useQueryClient();
  
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/certificados'],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: [],
    placeholderData: []
  });

  const requestCertificateMutation = useMutation({
    mutationFn: async (data: { enrollmentId: number; tipoCertificado: string; titulo: string }) => {
      const response = await fetch('/api/student/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('student_token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao solicitar certificado');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/certificados'] });
      toast.success('Certificado solicitado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao solicitar certificado. Tente novamente.');
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'emitido': { variant: 'default' as const, label: 'Emitido', color: 'text-green-700 bg-green-100' },
      'processando': { variant: 'secondary' as const, label: 'Em Processamento', color: 'text-blue-700 bg-blue-100' },
      'pendente': { variant: 'outline' as const, label: 'Pendente', color: 'text-yellow-700 bg-yellow-100' },
      'rejeitado': { variant: 'destructive' as const, label: 'Rejeitado', color: 'text-red-700 bg-red-100' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, color: 'text-gray-700 bg-gray-100' };
  };

  const handleDownload = (certificate: Certificate) => {
    if (certificate.urlDownload) {
      window.open(certificate.urlDownload, '_blank');
    }
  };

  const handleViewVerification = (codigoVerificacao: string) => {
    const verificationUrl = `/verificar-certificado?codigo=${codigoVerificacao}`;
    window.open(verificationUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
        <p className="text-gray-600">Visualize e baixe seus certificados ou solicite novos</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum certificado encontrado</h3>
            <p className="text-gray-500 text-center">
              Você ainda não possui certificados. Complete seus cursos para solicitar certificados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {certificates.map((certificate: Certificate) => {
            const statusBadge = getStatusBadge(certificate.status);
            
            return (
              <Card key={certificate.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{certificate.titulo}</CardTitle>
                      <CardDescription className="mt-1">
                        {certificate.enrollment.course.nome} • {certificate.enrollment.course.modalidade}
                      </CardDescription>
                      <CardDescription className="mt-1">
                        Tipo: {certificate.tipoCertificado}
                      </CardDescription>
                    </div>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informações do certificado */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Data da solicitação:</span>
                      <p className="font-medium">
                        {new Date(certificate.dataSolicitacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    {certificate.dataEmissao && (
                      <div>
                        <span className="text-gray-600">Data de emissão:</span>
                        <p className="font-medium">
                          {new Date(certificate.dataEmissao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    
                    {certificate.validoAte && (
                      <div>
                        <span className="text-gray-600">Válido até:</span>
                        <p className="font-medium">
                          {new Date(certificate.validoAte).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    
                    {certificate.codigoVerificacao && (
                      <div>
                        <span className="text-gray-600">Código de verificação:</span>
                        <p className="font-mono font-medium text-sm">
                          {certificate.codigoVerificacao}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  {certificate.observacoes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-1">Observações:</p>
                      <p className="text-sm text-gray-600">{certificate.observacoes}</p>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 pt-2">
                    {certificate.status === 'emitido' && certificate.urlDownload && (
                      <Button 
                        size="sm" 
                        onClick={() => handleDownload(certificate)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Certificado
                      </Button>
                    )}
                    
                    {certificate.codigoVerificacao && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewVerification(certificate.codigoVerificacao!)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Verificar Autenticidade
                      </Button>
                    )}
                    
                    {certificate.status === 'processando' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>Processando certificado...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Informações sobre certificados */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 text-base">Como solicitar um certificado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• Complete 100% do seu curso</li>
            <li>• Certifique-se de que sua documentação está aprovada</li>
            <li>• Quite todas as mensalidades pendentes</li>
            <li>• Entre em contato com a secretaria para solicitar</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}