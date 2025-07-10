import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, Search, Filter, Download, Eye, FileText, 
  User, GraduationCap, Calendar, Award, Settings, Printer,
  CheckCircle, Clock, XCircle, AlertCircle
} from 'lucide-react';

// Tipos baseados no schema atualizado
interface AcademicCourse {
  id: number;
  nome: string;
  categoria: string;
  areaConhecimento: string;
  modalidade: string;
  cargaHoraria: number;
  status: string;
}

interface AcademicStudent {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  courseId: number;
  status: string;
  notaFinal?: number;
  dataMatricula?: string;
}

interface AcademicCertificate {
  id: number;
  studentId: number;
  courseId: number;
  numeroRegistro?: string;
  dataEmissao?: string;
  dataValidade?: string;
  dataSolicitacao?: string;
  status: string;
  observacoes?: string;
  livro?: string;
  folha?: string;
  solicitadoPor?: number;
  autorizadoPor?: number;
  emitidoPor?: number;
  student?: AcademicStudent;
  course?: AcademicCourse;
}

interface CertificateStats {
  total: number;
  solicitados: number;
  autorizados: number;
  emitidos: number;
  revogados: number;
}

const CertificadosPos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<AcademicCertificate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar certificados acadêmicos
  const { data: certificates = [], isLoading: loadingCertificates } = useQuery({
    queryKey: ['/api/academic/certificates'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/certificates');
      return response as AcademicCertificate[];
    }
  });

  // Buscar cursos para dropdowns
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/academic/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/courses');
      return response as AcademicCourse[];
    }
  });

  // Buscar alunos para dropdowns
  const { data: students = [] } = useQuery({
    queryKey: ['/api/academic/students'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/students');
      return response as AcademicStudent[];
    }
  });

  // Mutation para criar certificado
  const createCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/academic/certificates', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/certificates'] });
      setIsCreateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Certificado criado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar certificado', variant: 'destructive' });
    }
  });

  // Mutation para atualizar status do certificado
  const updateCertificateStatusMutation = useMutation({
    mutationFn: async ({ id, status, observacoes }: { id: number; status: string; observacoes?: string }) => {
      return apiRequest(`/api/academic/certificates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, observacoes }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/certificates'] });
      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  });

  // Calcular estatísticas
  const stats: CertificateStats = React.useMemo(() => {
    const total = certificates.length;
    const solicitados = certificates.filter(c => c.status === 'solicitado').length;
    const autorizados = certificates.filter(c => c.status === 'autorizado').length;
    const emitidos = certificates.filter(c => c.status === 'emitido').length;
    const revogados = certificates.filter(c => c.status === 'revogado').length;

    return { total, solicitados, autorizados, emitidos, revogados };
  }, [certificates]);

  // Filtrar certificados
  const filteredCertificates = React.useMemo(() => {
    return certificates.filter(certificate => {
      const matchesSearch = !searchTerm || 
        certificate.student?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        certificate.student?.cpf.includes(searchTerm) ||
        certificate.course?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        certificate.numeroRegistro?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || certificate.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'all' || certificate.course?.categoria === categoriaFilter;
      const matchesModalidade = modalidadeFilter === 'all' || certificate.course?.modalidade === modalidadeFilter;

      return matchesSearch && matchesStatus && matchesCategoria && matchesModalidade;
    });
  }, [certificates, searchTerm, statusFilter, categoriaFilter, modalidadeFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const paginatedCertificates = filteredCertificates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const configs = {
      solicitado: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
      autorizado: { variant: 'secondary' as const, icon: CheckCircle, color: 'text-blue-600' },
      emitido: { variant: 'default' as const, icon: Award, color: 'text-green-600' },
      revogado: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    };

    const config = configs[status as keyof typeof configs] || configs.solicitado;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Função para autorizar certificado
  const handleAuthorize = (certificate: AcademicCertificate) => {
    updateCertificateStatusMutation.mutate({
      id: certificate.id,
      status: 'autorizado',
      observacoes: 'Autorizado para emissão'
    });
  };

  // Função para emitir certificado
  const handleEmit = (certificate: AcademicCertificate) => {
    const numeroRegistro = `CERT-${Date.now()}-${certificate.id}`;
    const livro = '001';
    const folha = String(certificate.id).padStart(3, '0');
    
    updateCertificateStatusMutation.mutate({
      id: certificate.id,
      status: 'emitido',
      observacoes: `Certificado emitido - Livro: ${livro}, Folha: ${folha}, Registro: ${numeroRegistro}`
    });
  };

  // Função para revogar certificado
  const handleRevoke = (certificate: AcademicCertificate) => {
    updateCertificateStatusMutation.mutate({
      id: certificate.id,
      status: 'revogado',
      observacoes: 'Certificado revogado por solicitação'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certificados Acadêmicos</h1>
          <p className="text-muted-foreground">Gestão de certificados de Pós-Graduação e Segunda Licenciatura</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Certificado
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitados</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.solicitados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.autorizados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emitidos</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.emitidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revogados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.revogados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno, CPF, curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="solicitado">Solicitado</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="emitido">Emitido</SelectItem>
                <SelectItem value="revogado">Revogado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Modalidades</SelectItem>
                <SelectItem value="ead">EAD</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Certificados */}
      <Card>
        <CardHeader>
          <CardTitle>Certificados Acadêmicos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCertificates ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCertificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{certificate.student?.nome || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {certificate.student?.cpf || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{certificate.course?.nome || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {certificate.course?.areaConhecimento || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {certificate.course?.categoria?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(certificate.status)}
                      </TableCell>
                      <TableCell>
                        {certificate.dataSolicitacao ? 
                          new Date(certificate.dataSolicitacao).toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCertificate(certificate);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {certificate.status === 'solicitado' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAuthorize(certificate)}
                            >
                              Autorizar
                            </Button>
                          )}
                          
                          {certificate.status === 'autorizado' && (
                            <Button
                              size="sm"
                              onClick={() => handleEmit(certificate)}
                            >
                              Emitir
                            </Button>
                          )}
                          
                          {certificate.status === 'emitido' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {/* Implementar download PDF */}}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="flex items-center px-4 text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização de Certificado */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Certificado #{selectedCertificate?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="space-y-6">
              {/* Informações do Aluno */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Aluno
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{selectedCertificate.student?.nome}</p>
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <p className="font-medium">{selectedCertificate.student?.cpf}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedCertificate.student?.email}</p>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <p className="font-medium">{selectedCertificate.student?.telefone || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Curso */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Informações do Curso
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Curso</Label>
                    <p className="font-medium">{selectedCertificate.course?.nome}</p>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <p className="font-medium">{selectedCertificate.course?.categoria?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label>Área do Conhecimento</Label>
                    <p className="font-medium">{selectedCertificate.course?.areaConhecimento}</p>
                  </div>
                  <div>
                    <Label>Modalidade</Label>
                    <p className="font-medium">{selectedCertificate.course?.modalidade?.toUpperCase()}</p>
                  </div>
                  <div>
                    <Label>Carga Horária</Label>
                    <p className="font-medium">{selectedCertificate.course?.cargaHoraria}h</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Certificado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Informações do Certificado
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedCertificate.status)}
                    </div>
                  </div>
                  <div>
                    <Label>Número de Registro</Label>
                    <p className="font-medium">{selectedCertificate.numeroRegistro || 'Não definido'}</p>
                  </div>
                  <div>
                    <Label>Data de Solicitação</Label>
                    <p className="font-medium">
                      {selectedCertificate.dataSolicitacao ? 
                        new Date(selectedCertificate.dataSolicitacao).toLocaleDateString('pt-BR') : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <Label>Data de Emissão</Label>
                    <p className="font-medium">
                      {selectedCertificate.dataEmissao ? 
                        new Date(selectedCertificate.dataEmissao).toLocaleDateString('pt-BR') : 
                        'Não emitido'
                      }
                    </p>
                  </div>
                  <div>
                    <Label>Livro</Label>
                    <p className="font-medium">{selectedCertificate.livro || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Folha</Label>
                    <p className="font-medium">{selectedCertificate.folha || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {selectedCertificate.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedCertificate.observacoes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2">
                {selectedCertificate.status === 'solicitado' && (
                  <Button onClick={() => handleAuthorize(selectedCertificate)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Autorizar Certificado
                  </Button>
                )}
                
                {selectedCertificate.status === 'autorizado' && (
                  <Button onClick={() => handleEmit(selectedCertificate)}>
                    <Award className="h-4 w-4 mr-2" />
                    Emitir Certificado
                  </Button>
                )}
                
                {selectedCertificate.status === 'emitido' && (
                  <>
                    <Button variant="outline" onClick={() => {/* Implementar download PDF */}}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" onClick={() => {/* Implementar impressão */}}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button variant="destructive" onClick={() => handleRevoke(selectedCertificate)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Revogar Certificado
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criação de Certificado */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Certificado Acadêmico
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              studentId: parseInt(formData.get('studentId') as string),
              courseId: parseInt(formData.get('courseId') as string),
              observacoes: formData.get('observacoes') as string,
              status: 'solicitado'
            };
            createCertificateMutation.mutate(data);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="studentId">Aluno</Label>
                <Select name="studentId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.nome} - {student.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="courseId">Curso</Label>
                <Select name="courseId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.nome} - {course.categoria.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  name="observacoes"
                  placeholder="Observações sobre o certificado"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCertificateMutation.isPending}>
                  {createCertificateMutation.isPending ? 'Criando...' : 'Criar Certificado'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificadosPos;