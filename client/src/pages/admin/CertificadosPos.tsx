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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Download, Eye, FileText, 
  User, GraduationCap, Calendar, Award, Settings, Printer,
  CheckCircle, Clock, XCircle, AlertCircle, ArrowLeft, Edit
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

interface CertificateTemplate {
  id: number;
  nome: string;
  categoria: string;
  tipo: string;
  htmlTemplate: string;
  templateVerso: string;
  variaveis: any[];
  instituicaoNome: string;
  instituicaoEndereco?: string;
  instituicaoLogo?: string;
  assinaturaDigital1?: string;
  assinaturaDigital2?: string;
  textoLegal: string;
  qrCodePosition: string;
  isActive: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

const CertificadosPos = () => {
  const [activeTab, setActiveTab] = useState('certificados');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<AcademicCertificate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para modelos de certificados
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isViewTemplateModalOpen, setIsViewTemplateModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCategoriaFilter, setTemplateCategoriaFilter] = useState<string>('all');
  const [templateTipoFilter, setTemplateTipoFilter] = useState<string>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Função para preview do template
  const handlePreviewTemplate = (template: CertificateTemplate) => {
    // Criar dados de exemplo para preview
    const dadosExemplo = {
      nomeAluno: "João Silva Santos",
      nomeCurso: template.categoria === 'pos_graduacao' ? "Pós-Graduação em Psicopedagogia" : "Segunda Licenciatura em Pedagogia",
      cpfAluno: "123.456.789-00",
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      instituicao: template.instituicaoNome,
      cargaHoraria: "420",
      numeroRegistro: "001/2025",
      areaCurso: "Educação"
    };

    // Substituir variáveis no template HTML da frente
    let htmlFrente = template.htmlTemplate;
    Object.entries(dadosExemplo).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlFrente = htmlFrente.replace(regex, value);
    });

    // Substituir variáveis no template HTML do verso
    let htmlVerso = template.templateVerso;
    Object.entries(dadosExemplo).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlVerso = htmlVerso.replace(regex, value);
    });

    // Abrir nova janela com o preview organizado
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview Certificado - ${template.nome}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f0f0f0;
            }
            .preview-header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding: 15px; 
              background: #fff; 
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .page-container {
              background: white;
              margin: 20px auto;
              padding: 40px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              border-radius: 8px;
              max-width: 900px;
            }
            .page-title {
              background: #e3f2fd;
              color: #1976d2;
              padding: 10px 20px;
              margin: -40px -40px 30px -40px;
              border-radius: 8px 8px 0 0;
              font-weight: bold;
              text-align: center;
              border-bottom: 3px solid #1976d2;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
            }
            .print-controls {
              text-align: center;
              margin: 20px 0;
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .print-controls button {
              background: #1976d2;
              color: white;
              border: none;
              padding: 10px 20px;
              margin: 0 10px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            .print-controls button:hover {
              background: #1565c0;
            }
            @media print { 
              .preview-header, .print-controls { display: none; }
              .page-container { 
                margin: 0; 
                padding: 0; 
                box-shadow: none; 
                border-radius: 0;
                max-width: none;
              }
              .page-title { margin: 0; }
              body { background: white; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="preview-header">
            <h2>Preview Completo: ${template.nome}</h2>
            <p>Certificado com frente e verso (histórico escolar) - Dados de exemplo para demonstração</p>
          </div>

          <div class="print-controls">
            <button onclick="window.print()">🖨️ Imprimir Certificado</button>
            <button onclick="window.close()">✖️ Fechar Preview</button>
          </div>
          
          <!-- PÁGINA 1 - FRENTE DO CERTIFICADO -->
          <div class="page-container">
            <div class="page-title">PÁGINA 1 - FRENTE DO CERTIFICADO</div>
            ${htmlFrente}
          </div>
          
          <!-- PÁGINA 2 - VERSO DO CERTIFICADO (HISTÓRICO) -->
          <div class="page-container page-break">
            <div class="page-title">PÁGINA 2 - VERSO DO CERTIFICADO (HISTÓRICO ESCOLAR)</div>
            ${htmlVerso}
          </div>

          <div class="print-controls">
            <p><strong>📋 Instruções:</strong></p>
            <p>• Este preview mostra o certificado completo com frente e verso</p>
            <p>• Use o botão "Imprimir" para gerar o PDF final</p>
            <p>• Na impressão, as duas páginas serão separadas automaticamente</p>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

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

  // Buscar modelos de certificados
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['/api/certificate-templates'],
    queryFn: async () => {
      const response = await apiRequest('/api/certificate-templates');
      return response as CertificateTemplate[];
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

  // Mutations para modelos de certificados
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/certificate-templates', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      setIsCreateTemplateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Modelo de certificado criado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar modelo de certificado', variant: 'destructive' });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/certificate-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      setIsEditTemplateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Modelo de certificado atualizado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar modelo de certificado', variant: 'destructive' });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/certificate-templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      toast({ title: 'Sucesso', description: 'Modelo de certificado excluído com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao excluir modelo de certificado', variant: 'destructive' });
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

  // Função para preview de certificado real
  const handlePreviewCertificate = (certificate: AcademicCertificate) => {
    // Para certificados emitidos, vamos usar o template padrão (ID 2 está disponível no banco)
    // Em uma implementação real, você pode associar cada certificado a um template específico
    const templateId = 2; // ID do template disponível no banco
    
    const previewUrl = `/api/certificates/${certificate.id}/preview/${templateId}`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  };

  // Função para download do PDF do certificado
  const handleDownloadPDF = async (certificate: AcademicCertificate) => {
    try {
      // Para certificados emitidos, vamos usar o template padrão (ID 2 está disponível no banco)
      const templateId = 2; // ID do template disponível no banco
      
      const response = await fetch(`/api/certificates/${certificate.id}/generate-pdf/${templateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      // Fazer download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `certificado-${certificate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ 
        title: 'Sucesso', 
        description: 'PDF do certificado baixado com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({ 
        title: 'Erro', 
        description: 'Erro ao baixar o PDF do certificado', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Certificados Acadêmicos</h1>
            <p className="text-muted-foreground">Gestão de certificados de Pós-Graduação e Segunda Licenciatura</p>
          </div>
        </div>
        <Button 
          onClick={() => activeTab === 'certificados' ? setIsCreateModalOpen(true) : setIsCreateTemplateModalOpen(true)} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'certificados' ? 'Novo Certificado' : 'Novo Modelo'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certificados" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Certificados
          </TabsTrigger>
          <TabsTrigger value="modelos" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Modelos de Certificados
          </TabsTrigger>
        </TabsList>

        {/* Aba de Certificados */}
        <TabsContent value="certificados" className="space-y-6">

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
                    <Button variant="outline" onClick={() => handlePreviewCertificate(selectedCertificate)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Certificado
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadPDF(selectedCertificate)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" onClick={() => handlePreviewCertificate(selectedCertificate)}>
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

        </TabsContent>

        {/* Aba de Modelos de Certificados */}
        <TabsContent value="modelos" className="space-y-6">
          
          {/* Cards de Estatísticas para Modelos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Modelos</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Modelos Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.isActive).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pós-Graduação</CardTitle>
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {templates.filter(t => t.categoria === 'pos_graduacao').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Segunda Graduação</CardTitle>
                <Award className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {templates.filter(t => t.categoria === 'segunda_graduacao').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros para Modelos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Modelos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do modelo..."
                    value={templateSearchTerm}
                    onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={templateCategoriaFilter} onValueChange={setTemplateCategoriaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                    <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                    <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={templateTipoFilter} onValueChange={setTemplateTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="certificado">Certificado</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="declaracao">Declaração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Modelos */}
          <Card>
            <CardHeader>
              <CardTitle>Modelos de Certificados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTemplates ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum modelo encontrado</h3>
                  <p className="text-muted-foreground mb-4">Crie seu primeiro modelo de certificado para começar.</p>
                  <Button onClick={() => setIsCreateTemplateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Modelo
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates
                    .filter(template => {
                      const matchesSearch = !templateSearchTerm || 
                        template.nome.toLowerCase().includes(templateSearchTerm.toLowerCase());
                      const matchesCategoria = templateCategoriaFilter === 'all' || 
                        template.categoria === templateCategoriaFilter;
                      const matchesTipo = templateTipoFilter === 'all' || 
                        template.tipo === templateTipoFilter;
                      return matchesSearch && matchesCategoria && matchesTipo;
                    })
                    .map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{template.nome}</CardTitle>
                              <div className="flex gap-2">
                                <Badge variant="outline">
                                  {template.categoria.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary">
                                  {template.tipo}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {template.isActive ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Inativo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p><strong>Instituição:</strong> {template.instituicaoNome}</p>
                            <p><strong>Posição QR Code:</strong> {template.qrCodePosition}</p>
                            <p><strong>Variáveis:</strong> {template.variaveis?.length || 0} campos</p>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsViewTemplateModalOpen(true);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsEditTemplateModalOpen(true);
                              }}
                              title="Editar modelo"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewTemplate(template)}
                              title="Preview PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir o modelo "${template.nome}"?`)) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                              title="Excluir modelo"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Criação de Modelo */}
          <Dialog open={isCreateTemplateModalOpen} onOpenChange={setIsCreateTemplateModalOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Modelo de Certificado
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  nome: formData.get('nome') as string,
                  categoria: formData.get('categoria') as string,
                  tipo: formData.get('tipo') as string,
                  htmlTemplate: formData.get('htmlTemplate') as string,
                  templateVerso: formData.get('templateVerso') as string,
                  orientation: formData.get('orientation') as string,
                  variaveis: JSON.parse(formData.get('variaveis') as string || '[]'),
                  instituicaoNome: formData.get('instituicaoNome') as string,
                  instituicaoEndereco: formData.get('instituicaoEndereco') as string,
                  instituicaoLogo: formData.get('instituicaoLogo') as string,
                  assinaturaDigital1: formData.get('assinaturaDigital1') as string,
                  assinaturaDigital2: formData.get('assinaturaDigital2') as string,
                  textoLegal: formData.get('textoLegal') as string,
                  qrCodePosition: formData.get('qrCodePosition') as string,
                  isActive: formData.get('isActive') === 'on'
                };
                createTemplateMutation.mutate(data);
              }}>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome do Modelo *</Label>
                      <Input name="nome" required placeholder="Ex: Certificado Pós-Graduação Padrão" />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select name="categoria" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                          <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                          <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select name="tipo" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="certificado">Certificado</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="declaracao">Declaração</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="instituicaoNome">Nome da Instituição *</Label>
                      <Input name="instituicaoNome" required placeholder="Ex: Universidade XYZ" />
                    </div>
                    <div>
                      <Label htmlFor="orientation">Orientação do Certificado *</Label>
                      <Select name="orientation" required defaultValue="landscape">
                        <SelectTrigger>
                          <SelectValue placeholder="Orientação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Retrato (Vertical)</SelectItem>
                          <SelectItem value="landscape">Paisagem (Horizontal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="qrCodePosition">Posição do QR Code *</Label>
                      <Select name="qrCodePosition" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Posição do QR Code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inferior_esquerdo">Inferior Esquerdo</SelectItem>
                          <SelectItem value="inferior_direito">Inferior Direito</SelectItem>
                          <SelectItem value="superior_esquerdo">Superior Esquerdo</SelectItem>
                          <SelectItem value="superior_direito">Superior Direito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instituicaoEndereco">Endereço da Instituição</Label>
                    <Input name="instituicaoEndereco" placeholder="Rua, número, cidade, estado" />
                  </div>

                  {/* Sistema de Abas para Template HTML */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Templates HTML *</Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex space-x-1 mb-4">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white"
                          onClick={() => document.getElementById('tab-frente')?.scrollIntoView()}
                        >
                          Frente (Certificado)
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm font-medium rounded-md bg-orange-600 text-white"
                          onClick={() => document.getElementById('tab-verso')?.scrollIntoView()}
                        >
                          Verso (Histórico)
                        </button>
                      </div>
                      
                      <div id="tab-frente" className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <Label htmlFor="htmlTemplate" className="font-medium">Template HTML - Frente do Certificado *</Label>
                        </div>
                        <Textarea
                          name="htmlTemplate"
                          required
                          className="min-h-32 bg-white"
                          placeholder="Cole aqui o código HTML da frente do certificado..."
                        />
                      </div>
                      
                      <div id="tab-verso" className="space-y-3 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                          <Label htmlFor="templateVerso" className="font-medium">Template HTML - Verso do Certificado (Histórico) *</Label>
                        </div>
                        <Textarea
                          name="templateVerso"
                          required
                          className="min-h-32 bg-white"
                          placeholder="Cole aqui o código HTML do verso do certificado (histórico escolar completo)..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="textoLegal">Texto Legal *</Label>
                    <Textarea
                      name="textoLegal"
                      required
                      placeholder="Texto legal para validação do certificado..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="variaveis">Variáveis do Template (JSON)</Label>
                    <Textarea
                      name="variaveis"
                      placeholder='[{"nome": "nomeAluno", "tipo": "texto"}, {"nome": "nomeCurso", "tipo": "texto"}]'
                      className="min-h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assinaturaDigital1">URL Assinatura Digital 1</Label>
                      <Input name="assinaturaDigital1" placeholder="https://..." />
                    </div>
                    <div>
                      <Label htmlFor="assinaturaDigital2">URL Assinatura Digital 2</Label>
                      <Input name="assinaturaDigital2" placeholder="https://..." />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instituicaoLogo">URL do Logo da Instituição</Label>
                    <Input name="instituicaoLogo" placeholder="https://..." />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" name="isActive" id="isActive" defaultChecked className="rounded" />
                    <Label htmlFor="isActive">Modelo ativo</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateTemplateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending ? 'Criando...' : 'Criar Modelo'}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal de Visualização de Modelo */}
          <Dialog open={isViewTemplateModalOpen} onOpenChange={setIsViewTemplateModalOpen}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visualizar Modelo: {selectedTemplate?.nome}
                </DialogTitle>
              </DialogHeader>
              
              {selectedTemplate && (
                <div className="space-y-4">
                  {/* Sistema de Abas para Preview */}
                  <div className="border-2 border-primary/20 rounded-lg p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg font-semibold text-primary">Preview Visual do Certificado</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Abrir preview completo em tela cheia (frente + verso)
                          const previewHtmlFrente = selectedTemplate.htmlTemplate
                            .replace(/{{nomeAluno}}/g, "João Silva Santos")
                            .replace(/{{nomeCurso}}/g, selectedTemplate.categoria === 'pos_graduacao' ? "Pós-Graduação em Psicopedagogia" : "Segunda Licenciatura em Pedagogia")
                            .replace(/{{cpfAluno}}/g, "123.456.789-00")
                            .replace(/{{dataEmissao}}/g, new Date().toLocaleDateString('pt-BR'))
                            .replace(/{{instituicao}}/g, selectedTemplate.instituicaoNome)
                            .replace(/{{cargaHoraria}}/g, "420")
                            .replace(/{{numeroRegistro}}/g, "001/2025")
                            .replace(/{{areaCurso}}/g, "Educação");
                            
                          const previewHtmlVerso = selectedTemplate.templateVerso
                            .replace(/{{nomeAluno}}/g, "João Silva Santos")
                            .replace(/{{nomeCurso}}/g, selectedTemplate.categoria === 'pos_graduacao' ? "Pós-Graduação em Psicopedagogia" : "Segunda Licenciatura em Pedagogia")
                            .replace(/{{cpfAluno}}/g, "123.456.789-00")
                            .replace(/{{dataEmissao}}/g, new Date().toLocaleDateString('pt-BR'))
                            .replace(/{{instituicao}}/g, selectedTemplate.instituicaoNome)
                            .replace(/{{cargaHoraria}}/g, "420")
                            .replace(/{{numeroRegistro}}/g, "001/2025")
                            .replace(/{{areaCurso}}/g, "Educação");
                            
                          const previewWindow = window.open('', '_blank', 'width=900,height=700');
                          if (previewWindow) {
                            previewWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Preview Completo - ${selectedTemplate.nome}</title>
                                <style>
                                  body { 
                                    font-family: 'Times New Roman', serif; 
                                    margin: 0; 
                                    padding: 20px; 
                                    background: #f5f5f5;
                                  }
                                  .page { 
                                    background: white;
                                    padding: 40px;
                                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                    max-width: 800px;
                                    width: 100%;
                                    border-radius: 8px;
                                    margin: 0 auto 20px;
                                    min-height: 600px;
                                  }
                                  .page-header {
                                    text-align: center;
                                    margin-bottom: 20px;
                                    padding: 10px;
                                    background: #e3f2fd;
                                    border-radius: 6px;
                                  }
                                  @media print { 
                                    body { background: white; }
                                    .page { box-shadow: none; page-break-after: always; }
                                    .page-header { display: none; }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="page">
                                  <div class="page-header">
                                    <h3 style="margin: 0; color: #1976d2;">PÁGINA 1 - FRENTE DO CERTIFICADO</h3>
                                  </div>
                                  ${previewHtmlFrente}
                                </div>
                                <div class="page">
                                  <div class="page-header">
                                    <h3 style="margin: 0; color: #f57c00;">PÁGINA 2 - VERSO DO CERTIFICADO (HISTÓRICO)</h3>
                                  </div>
                                  ${previewHtmlVerso}
                                </div>
                              </body>
                              </html>
                            `);
                            previewWindow.document.close();
                          }
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Preview Completo
                      </Button>
                    </div>
                    
                    {/* Preview limpo do certificado */}
                    <div className="space-y-6">
                      {/* Frente */}
                      <div 
                        className="bg-white border border-gray-300 shadow-lg mx-auto" 
                        style={{
                          width: '100%',
                          maxWidth: '1200px',
                          height: '600px',
                          aspectRatio: '1123/794'
                        }}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: selectedTemplate.htmlTemplate
                              .replace(/{{nomeAluno}}/g, "João Silva Santos")
                              .replace(/{{nomeCurso}}/g, selectedTemplate.categoria === 'pos_graduacao' ? "Pós-Graduação em Psicopedagogia" : "Segunda Licenciatura em Pedagogia")
                              .replace(/{{cpfAluno}}/g, "123.456.789-00")
                              .replace(/{{dataEmissao}}/g, new Date().toLocaleDateString('pt-BR'))
                              .replace(/{{instituicao}}/g, selectedTemplate.instituicaoNome)
                              .replace(/{{cargaHoraria}}/g, "420")
                              .replace(/{{numeroRegistro}}/g, "001/2025")
                              .replace(/{{areaCurso}}/g, "Educação")
                          }} 
                          style={{
                            fontFamily: 'Times New Roman, serif',
                            lineHeight: '1.4',
                            color: '#000',
                            fontSize: '14px',
                            textAlign: 'center',
                            padding: '30px',
                            height: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                          }}
                        />
                      </div>
                      
                      {/* Verso */}
                      <div 
                        className="bg-white border border-gray-300 shadow-lg mx-auto" 
                        style={{
                          width: '100%',
                          maxWidth: '1200px',
                          height: '600px',
                          aspectRatio: '1123/794'
                        }}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: selectedTemplate.templateVerso
                              .replace(/{{nomeAluno}}/g, "João Silva Santos")
                              .replace(/{{nomeCurso}}/g, selectedTemplate.categoria === 'pos_graduacao' ? "Pós-Graduação em Psicopedagogia" : "Segunda Licenciatura em Pedagogia")
                              .replace(/{{cpfAluno}}/g, "123.456.789-00")
                              .replace(/{{dataEmissao}}/g, new Date().toLocaleDateString('pt-BR'))
                              .replace(/{{instituicao}}/g, selectedTemplate.instituicaoNome)
                              .replace(/{{cargaHoraria}}/g, "420")
                              .replace(/{{numeroRegistro}}/g, "001/2025")
                              .replace(/{{areaCurso}}/g, "Educação")
                          }} 
                          style={{
                            fontFamily: 'Times New Roman, serif',
                            lineHeight: '1.3',
                            color: '#000',
                            fontSize: '12px',
                            textAlign: 'left',
                            padding: '30px',
                            height: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação principais */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handlePreviewTemplate(selectedTemplate)}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Preview PDF
                    </Button>
                    <Button variant="outline" onClick={() => setIsViewTemplateModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </TabsContent>

        {/* Modal de Edição de Modelo */}
        <Dialog open={isEditTemplateModalOpen} onOpenChange={setIsEditTemplateModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Editar Modelo de Certificado
              </DialogTitle>
            </DialogHeader>
            
            {selectedTemplate && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  nome: formData.get('nome') as string,
                  categoria: formData.get('categoria') as string,
                  tipo: formData.get('tipo') as string,
                  htmlTemplate: formData.get('htmlTemplate') as string,
                  templateVerso: formData.get('templateVerso') as string,
                  orientation: formData.get('orientation') as string,
                  variaveis: JSON.parse(formData.get('variaveis') as string || '[]'),
                  instituicaoNome: formData.get('instituicaoNome') as string,
                  instituicaoEndereco: formData.get('instituicaoEndereco') as string,
                  instituicaoLogo: formData.get('instituicaoLogo') as string,
                  assinaturaDigital1: formData.get('assinaturaDigital1') as string,
                  assinaturaDigital2: formData.get('assinaturaDigital2') as string,
                  textoLegal: formData.get('textoLegal') as string,
                  qrCodePosition: formData.get('qrCodePosition') as string,
                  isActive: formData.get('isActive') === 'on'
                };
                updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
              }}>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome do Modelo *</Label>
                      <Input name="nome" required placeholder="Ex: Certificado Pós-Graduação Padrão" 
                        defaultValue={selectedTemplate.nome} />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select name="categoria" required defaultValue={selectedTemplate.categoria}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                          <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                          <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select name="tipo" required defaultValue={selectedTemplate.tipo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="certificado">Certificado</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="declaracao">Declaração</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="instituicaoNome">Nome da Instituição *</Label>
                      <Input name="instituicaoNome" required placeholder="Ex: Universidade XYZ" 
                        defaultValue={selectedTemplate.instituicaoNome} />
                    </div>
                    <div>
                      <Label htmlFor="orientation">Orientação do Certificado *</Label>
                      <Select name="orientation" required defaultValue="landscape">
                        <SelectTrigger>
                          <SelectValue placeholder="Orientação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Retrato (Vertical)</SelectItem>
                          <SelectItem value="landscape">Paisagem (Horizontal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="qrCodePosition">Posição do QR Code *</Label>
                      <Select name="qrCodePosition" required defaultValue={selectedTemplate.qrCodePosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Posição do QR Code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inferior_esquerdo">Inferior Esquerdo</SelectItem>
                          <SelectItem value="inferior_direito">Inferior Direito</SelectItem>
                          <SelectItem value="superior_esquerdo">Superior Esquerdo</SelectItem>
                          <SelectItem value="superior_direito">Superior Direito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instituicaoEndereco">Endereço da Instituição</Label>
                    <Input name="instituicaoEndereco" placeholder="Rua, número, cidade, estado" 
                      defaultValue={selectedTemplate.instituicaoEndereco || ''} />
                  </div>

                  {/* Sistema de Abas para Template HTML */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Templates HTML *</Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex space-x-1 mb-4">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white"
                          onClick={() => document.getElementById('edit-tab-frente')?.scrollIntoView()}
                        >
                          Frente (Certificado)
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm font-medium rounded-md bg-orange-600 text-white"
                          onClick={() => document.getElementById('edit-tab-verso')?.scrollIntoView()}
                        >
                          Verso (Histórico)
                        </button>
                      </div>
                      
                      <div id="edit-tab-frente" className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <Label htmlFor="htmlTemplate" className="font-medium">Template HTML - Frente do Certificado *</Label>
                        </div>
                        <Textarea
                          name="htmlTemplate"
                          required
                          className="min-h-32 bg-white"
                          placeholder="Cole aqui o código HTML da frente do certificado..."
                          defaultValue={selectedTemplate.htmlTemplate}
                        />
                      </div>
                      
                      <div id="edit-tab-verso" className="space-y-3 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                          <Label htmlFor="templateVerso" className="font-medium">Template HTML - Verso do Certificado (Histórico) *</Label>
                        </div>
                        <Textarea
                          name="templateVerso"
                          required
                          className="min-h-32 bg-white"
                          placeholder="Cole aqui o código HTML do verso do certificado (histórico escolar completo)..."
                          defaultValue={selectedTemplate.templateVerso}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="textoLegal">Texto Legal *</Label>
                    <Textarea
                      name="textoLegal"
                      required
                      placeholder="Texto legal para validação do certificado..."
                      defaultValue={selectedTemplate.textoLegal}
                    />
                  </div>

                  <div>
                    <Label htmlFor="variaveis">Variáveis do Template (JSON)</Label>
                    <Textarea
                      name="variaveis"
                      placeholder='[{"nome": "nomeAluno", "tipo": "texto"}, {"nome": "nomeCurso", "tipo": "texto"}]'
                      className="min-h-20"
                      defaultValue={JSON.stringify(selectedTemplate.variaveis || [], null, 2)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assinaturaDigital1">URL Assinatura Digital 1</Label>
                      <Input name="assinaturaDigital1" placeholder="https://..." 
                        defaultValue={selectedTemplate.assinaturaDigital1 || ''} />
                    </div>
                    <div>
                      <Label htmlFor="assinaturaDigital2">URL Assinatura Digital 2</Label>
                      <Input name="assinaturaDigital2" placeholder="https://..." 
                        defaultValue={selectedTemplate.assinaturaDigital2 || ''} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instituicaoLogo">URL da Logo da Instituição</Label>
                    <Input name="instituicaoLogo" placeholder="https://exemplo.com/logo.png" 
                      defaultValue={selectedTemplate.instituicaoLogo || ''} />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="isActive" 
                      defaultChecked={selectedTemplate.isActive}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Modelo ativo (disponível para uso)</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditTemplateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateTemplateMutation.isPending}>
                      {updateTemplateMutation.isPending ? 'Atualizando...' : 'Atualizar Modelo'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

      </Tabs>
    </div>
  );
};

export default CertificadosPos;