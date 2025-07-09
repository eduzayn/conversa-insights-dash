import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  FileText, 
  CreditCard, 
  Award, 
  IdCard, 
  LogOut,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload
} from "lucide-react";

interface StudentData {
  id: number;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
  matriculaAtiva: boolean;
  documentacaoStatus?: string;
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

interface StudentDocument {
  id: number;
  tipoDocumento: string;
  nomeArquivo: string;
  dataEnvio: string;
  status: string;
}

interface StudentPayment {
  id: number;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
}

interface StudentCertificate {
  id: number;
  titulo: string;
  tipoCertificado: string;
  dataEmissao?: string;
  status: string;
  codigoVerificacao?: string;
}

export default function StudentPortal() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  useEffect(() => {
    // Verificar se há dados do aluno no localStorage
    const token = localStorage.getItem('student_token');
    const data = localStorage.getItem('student_data');
    
    if (!token || !data) {
      setLocation('/portal-aluno/login');
      return;
    }

    try {
      setStudentData(JSON.parse(data));
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      setLocation('/portal-aluno/login');
    }
  }, [setLocation]);

  // Queries para buscar dados do aluno
  const { data: enrollments = [] } = useQuery({
    queryKey: ['/api/student/enrollments'],
    enabled: !!studentData
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['/api/student/documents'],
    enabled: !!studentData
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['/api/student/payments'],
    enabled: !!studentData
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['/api/student/certificates'],
    enabled: !!studentData
  });

  const { data: studentCard } = useQuery({
    queryKey: ['/api/student/card'],
    enabled: !!studentData
  });

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_data');
    setLocation('/portal-aluno/login');
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'ativa': 'bg-green-500',
      'concluida': 'bg-blue-500',
      'cancelada': 'bg-red-500',
      'pendente': 'bg-yellow-500',
      'aprovado': 'bg-green-500',
      'reprovado': 'bg-red-500',
      'em_andamento': 'bg-blue-500',
      'pago': 'bg-green-500',
      'vencido': 'bg-red-500',
      'emitido': 'bg-green-500',
      'solicitado': 'bg-yellow-500'
    };
    return statusColors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
      case 'pago':
      case 'emitido':
        return <CheckCircle className="h-4 w-4" />;
      case 'reprovado':
      case 'vencido':
      case 'cancelada':
        return <XCircle className="h-4 w-4" />;
      case 'pendente':
      case 'solicitado':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!studentData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando portal do aluno...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Portal do Aluno</h1>
                <p className="text-sm text-gray-500">Bem-vindo, {studentData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{studentData.name}</p>
                  <p className="text-xs text-gray-500">{studentData.cpf}</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Certificados</span>
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center space-x-2">
              <IdCard className="h-4 w-4" />
              <span>Carteirinha</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status da Matrícula */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Status da Matrícula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${studentData.matriculaAtiva ? 'bg-green-500' : 'bg-red-500'} text-white`}
                    >
                      {studentData.matriculaAtiva ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Cursos Matriculados */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Cursos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {enrollments.filter((e: StudentEnrollment) => e.statusMatricula === 'ativa').length}
                  </div>
                  <p className="text-sm text-gray-500">matrículas ativas</p>
                </CardContent>
              </Card>

              {/* Progresso Geral */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Progresso Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {enrollments.length > 0 
                      ? Math.round(enrollments.reduce((acc: number, e: StudentEnrollment) => acc + e.progresso, 0) / enrollments.length)
                      : 0
                    }%
                  </div>
                  <p className="text-sm text-gray-500">dos cursos</p>
                </CardContent>
              </Card>
            </div>

            {/* Cursos em Andamento */}
            <Card>
              <CardHeader>
                <CardTitle>Meus Cursos</CardTitle>
                <CardDescription>Acompanhe o progresso dos seus cursos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum curso encontrado</p>
                    </div>
                  ) : (
                    enrollments.map((enrollment: StudentEnrollment) => (
                      <div key={enrollment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{enrollment.nomeCurso}</h3>
                            <p className="text-sm text-gray-500">{enrollment.modalidade}</p>
                          </div>
                          <Badge className={getStatusColor(enrollment.statusMatricula)}>
                            {enrollment.statusMatricula}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Matrícula: {new Date(enrollment.dataMatricula).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{enrollment.horasCompletadas}h / {enrollment.cargaHoraria}h</span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progresso}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">{enrollment.progresso}% concluído</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Documentos</CardTitle>
                <CardDescription>Gerencie e acompanhe seus documentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum documento encontrado</p>
                      <Button className="mt-4" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Documento
                      </Button>
                    </div>
                  ) : (
                    documents.map((document: StudentDocument) => (
                      <div key={document.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <h3 className="font-medium text-gray-900">{document.nomeArquivo}</h3>
                            <p className="text-sm text-gray-500">{document.tipoDocumento}</p>
                            <p className="text-xs text-gray-400">
                              Enviado em {new Date(document.dataEnvio).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getStatusColor(document.status)} text-white flex items-center space-x-1`}>
                            {getStatusIcon(document.status)}
                            <span>{document.status}</span>
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Área Financeira</CardTitle>
                <CardDescription>Acompanhe seus pagamentos e mensalidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum pagamento encontrado</p>
                    </div>
                  ) : (
                    payments.map((payment: StudentPayment) => (
                      <div key={payment.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{payment.descricao}</h3>
                          <p className="text-sm text-gray-500">
                            Vencimento: {new Date(payment.dataVencimento).toLocaleDateString('pt-BR')}
                          </p>
                          {payment.dataPagamento && (
                            <p className="text-xs text-green-600">
                              Pago em {new Date(payment.dataPagamento).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            R$ {payment.valor.toFixed(2).replace('.', ',')}
                          </p>
                          <Badge className={`${getStatusColor(payment.status)} text-white flex items-center space-x-1`}>
                            {getStatusIcon(payment.status)}
                            <span>{payment.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Certificados</CardTitle>
                <CardDescription>Visualize e baixe seus certificados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum certificado encontrado</p>
                      <p className="text-sm">Conclua seus cursos para gerar certificados</p>
                    </div>
                  ) : (
                    certificates.map((certificate: StudentCertificate) => (
                      <div key={certificate.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Award className="h-8 w-8 text-yellow-500" />
                          <div>
                            <h3 className="font-medium text-gray-900">{certificate.titulo}</h3>
                            <p className="text-sm text-gray-500">{certificate.tipoCertificado}</p>
                            {certificate.dataEmissao && (
                              <p className="text-xs text-gray-400">
                                Emitido em {new Date(certificate.dataEmissao).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            {certificate.codigoVerificacao && (
                              <p className="text-xs text-blue-600">
                                Código: {certificate.codigoVerificacao}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getStatusColor(certificate.status)} text-white flex items-center space-x-1`}>
                            {getStatusIcon(certificate.status)}
                            <span>{certificate.status}</span>
                          </Badge>
                          {certificate.status === 'emitido' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Card Tab */}
          <TabsContent value="card" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Carteirinha Estudantil</CardTitle>
                <CardDescription>Sua identificação acadêmica digital</CardDescription>
              </CardHeader>
              <CardContent>
                {!studentCard ? (
                  <div className="text-center py-8">
                    <IdCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">Você ainda não possui uma carteirinha estudantil</p>
                    <Button>
                      <IdCard className="h-4 w-4 mr-2" />
                      Gerar Carteirinha
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">Carteirinha Estudantil</h3>
                          <p className="text-blue-100 text-sm">{studentCard.numeroCarteirinha}</p>
                        </div>
                        <GraduationCap className="h-8 w-8 text-blue-200" />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">{studentData.name}</p>
                        <p className="text-blue-100">{studentData.cpf}</p>
                        {studentCard.cursoAtual && (
                          <p className="text-blue-100 text-sm">{studentCard.cursoAtual}</p>
                        )}
                        <p className="text-blue-200 text-xs">
                          Válido até: {new Date(studentCard.validoAte).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-blue-400">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-blue-200">
                            Status: {studentCard.status}
                          </div>
                          <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                            <div className="text-xs text-gray-600 text-center">QR</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}