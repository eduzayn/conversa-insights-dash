import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, FileText, Calendar, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { Certification } from '@shared/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const STATUS_COLORS = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'em_andamento': 'bg-blue-100 text-blue-800',
  'concluido': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
  'em_atraso': 'bg-orange-100 text-orange-800'
};

const STATUS_LABELS = {
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'concluido': 'Concluído',
  'cancelado': 'Cancelado',
  'em_atraso': 'Em Atraso'
};

const SUBCATEGORIA_LABELS = {
  'segunda_licenciatura': 'Segunda Licenciatura',
  'formacao_pedagogica': 'Formação Pedagógica',
  'pedagogia_bachareis': 'Pedagogia para Bacharéis e Tecnólogos'
};

const ACADEMIC_STATUS_LABELS = {
  'nao_possui': 'Não Possui',
  'aprovado': 'Aprovado',
  'reprovado': 'Reprovado',
  'em_correcao': 'Em Correção'
};

const ACADEMIC_STATUS_COLORS = {
  'nao_possui': 'bg-gray-100 text-gray-800',
  'aprovado': 'bg-green-100 text-green-800',
  'reprovado': 'bg-red-100 text-red-800',
  'em_correcao': 'bg-yellow-100 text-yellow-800'
};

export default function Certificacoes() {
  const [activeTab, setActiveTab] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterModalidade, setFilterModalidade] = useState('');

  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [editCourseSearchOpen, setEditCourseSearchOpen] = useState(false);
  const [isNewCourseDialogOpen, setIsNewCourseDialogOpen] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ nome: '', cargaHoraria: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Função para calcular similaridade entre strings usando Levenshtein Distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    // Matriz para programação dinâmica
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletar
          matrix[i][j - 1] + 1,      // inserir
          matrix[i - 1][j - 1] + cost // substituir
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  };

  // Função para detectar certificações duplicadas/similares
  const detectDuplicates = (certifications: Certification[]) => {
    const duplicates: { [key: string]: Certification[] } = {};
    const processed = new Set<number>();
    
    certifications.forEach((cert, index) => {
      if (processed.has(cert.id)) return;
      
      const similarCerts = certifications.filter((otherCert, otherIndex) => {
        if (index === otherIndex || processed.has(otherCert.id)) return false;
        
        // Mesmo aluno e CPF
        const sameStudent = cert.aluno === otherCert.aluno && cert.cpf === otherCert.cpf;
        if (!sameStudent) return false;
        
        // Extrair apenas o nome específico do curso (remover prefixos comuns)
        const cleanCourseName1 = (cert.curso || '').replace(/^(Pós-Graduação em|Segunda Licenciatura em|Formação Pedagógica em|Graduação em)\s*/i, '').trim();
        const cleanCourseName2 = (otherCert.curso || '').replace(/^(Pós-Graduação em|Segunda Licenciatura em|Formação Pedagógica em|Graduação em)\s*/i, '').trim();
        
        // Calcular similaridade dos cursos com threshold mais restritivo (85%)
        const similarity = calculateSimilarity(cleanCourseName1, cleanCourseName2);
        
        // Verificação adicional: evitar falsos positivos em cursos muito diferentes
        const words1 = cleanCourseName1.toLowerCase().split(/\s+/);
        const words2 = cleanCourseName2.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
        
        // Só considerar como duplicata se tiver alta similaridade E palavras-chave em comum
        return similarity >= 0.85 && (commonWords.length >= 2 || similarity >= 0.95);
      });
      
      if (similarCerts.length > 0) {
        const key = `${cert.aluno}-${cert.cpf}`;
        duplicates[key] = [cert, ...similarCerts];
        
        // Marcar como processados
        processed.add(cert.id);
        similarCerts.forEach(sc => processed.add(sc.id));
      }
    });
    
    return duplicates;
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const getCategoriaFromTab = (tab: string) => {
    switch(tab) {
      case 'pos': return 'pos_graduacao';
      case 'segunda': return 'segunda_licenciatura';
      case 'formacao_pedagogica': return 'formacao_pedagogica';
      case 'formacao_livre': return 'formacao_livre';
      case 'diplomacao': return 'diplomacao_competencia';
      case 'eja': return 'eja';
      case 'graduacao': return 'graduacao';
      case 'capacitacao': return 'capacitacao';
      case 'sequencial': return 'sequencial';
      default: return 'pos_graduacao';
    }
  };

  // Nova função para obter modalidade específica da aba
  // Função removida: getModalidadeFromTab já não é necessária
  // Agora modalidade representa formato de entrega, não tipo acadêmico

  const [newCertification, setNewCertification] = useState({
    aluno: '',
    cpf: '',
    modalidade: 'Presencial', // Padrão: Presencial
    curso: '',
    cargaHoraria: '',
    financeiro: 'em_dia',
    documentacao: 'pendente',
    plataforma: 'pendente',
    tutoria: '',
    observacao: '',
    inicioCertificacao: '',
    dataPrevista: '',
    dataEntrega: '',
    diploma: '',
    status: 'pendente',
    categoria: getCategoriaFromTab(activeTab),
    tcc: 'nao_possui',
    praticasPedagogicas: 'nao_possui',
    estagio: 'nao_possui'
  });

  // Limpar filtros quando a aba muda
  useEffect(() => {
    setFilterStatus('');
    setFilterModalidade('');
    setFilterPeriodo('');
    setDataInicio('');
    setDataFim('');
    setSearchTerm('');
    setNewCertification(prev => ({
      ...prev,
      categoria: getCategoriaFromTab(activeTab)
    }));
  }, [activeTab]);

  const getDateRange = () => {
    const today = new Date();
    
    switch(filterPeriodo) {
      case 'hoje':
        return {
          inicio: format(startOfDay(today), 'yyyy-MM-dd'),
          fim: format(endOfDay(today), 'yyyy-MM-dd')
        };
      case 'semana':
        return {
          inicio: format(startOfWeek(today), 'yyyy-MM-dd'),
          fim: format(endOfWeek(today), 'yyyy-MM-dd')
        };
      case 'mes':
        return {
          inicio: format(startOfMonth(today), 'yyyy-MM-dd'),
          fim: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      case 'mes_passado':
        const lastMonth = subMonths(today, 1);
        return {
          inicio: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          fim: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      case 'personalizado':
        return {
          inicio: dataInicio,
          fim: dataFim
        };
      default:
        return null;
    }
  };

  // Função para obter categoria baseada na modalidade
  const getCategoriaFromModalidade = (modalidade: string) => {
    switch (modalidade) {
      case 'Segunda licenciatura':
      case 'Formação Pedagógica':
        return 'segunda_licenciatura';
      case 'Pós-graduação':
        return 'pos_graduacao';
      case 'Formação livre':
        return 'formacao_livre';
      case 'Diplomação por competência':
        return 'diplomacao_competencia';
      case 'EJA':
        return 'eja';
      case 'Graduação':
        return 'graduacao';
      case 'Capacitação':
        return 'capacitacao';
      case 'Sequencial':
        return 'sequencial';
      default:
        return getCategoriaFromTab(activeTab);
    }
  };

  // Query para buscar cursos pré-cadastrados para criação
  const { data: preRegisteredCoursesData = [] } = useQuery({
    queryKey: ['/api/cursos-pre-cadastrados', { categoria: getCategoriaFromModalidade(newCertification.modalidade), modalidade: newCertification.modalidade }],
    queryFn: async () => {
      const categoria = getCategoriaFromModalidade(newCertification.modalidade);
      const params = new URLSearchParams({
        categoria: categoria
      });
      
      if (newCertification.modalidade) {
        params.append('modalidade', newCertification.modalidade);
      }
      
      const response = await apiRequest(`/api/cursos-pre-cadastrados?${params}`);
      return response;
    }
  });
  const preRegisteredCourses = Array.isArray(preRegisteredCoursesData) ? preRegisteredCoursesData : [];

  // Query para buscar cursos pré-cadastrados para edição
  const { data: editPreRegisteredCoursesData = [] } = useQuery({
    queryKey: ['/api/cursos-pre-cadastrados-edit', { categoria: getCategoriaFromModalidade(selectedCertification?.modalidade || ''), modalidade: selectedCertification?.modalidade }],
    queryFn: async () => {
      const categoria = getCategoriaFromModalidade(selectedCertification?.modalidade || '');
      const params = new URLSearchParams({
        categoria: categoria
      });
      
      if (selectedCertification?.modalidade) {
        params.append('modalidade', selectedCertification.modalidade);
      }
      
      const response = await apiRequest(`/api/cursos-pre-cadastrados?${params}`);
      return response;
    },
    enabled: !!selectedCertification
  });
  const editPreRegisteredCourses = Array.isArray(editPreRegisteredCoursesData) ? editPreRegisteredCoursesData : [];

  const { data: certificationsData, isLoading } = useQuery({
    queryKey: ['/api/certificacoes', { 
      categoria: getCategoriaFromTab(activeTab),
      status: filterStatus,
      modalidade: filterModalidade,
      periodo: filterPeriodo,
      dataInicio,
      dataFim,
      search: searchTerm,
      page: currentPage,
      limit: pageSize
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        categoria: getCategoriaFromTab(activeTab),
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      
      // REMOVIDO: Filtro automático por modalidade da aba (agora modalidade = formato de entrega)
      // A modalidade agora representa formato (EAD/Presencial/Híbrido), não tipo acadêmico
      
      if (filterStatus && filterStatus !== 'todos') params.append('status', filterStatus);
      // Se há filtro manual de modalidade, ele sobrescreve o filtro da aba
      if (filterModalidade && filterModalidade !== 'todas') {
        params.set('modalidade', filterModalidade);
      }

      if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
      
      // Adicionar filtros de período
      if (filterPeriodo && filterPeriodo !== 'todos') {
        const dateRange = getDateRange();
        if (dateRange) {
          if (dateRange.inicio) params.append('dataInicio', dateRange.inicio);
          if (dateRange.fim) params.append('dataFim', dateRange.fim);
        }
      }
      
      const response = await apiRequest(`/api/certificacoes?${params}`);
      return response;
    }
  });

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, filterModalidade, filterPeriodo, searchTerm]);

  const certifications = certificationsData?.data || [];
  const totalCertifications = parseInt(certificationsData?.total) || 0;
  const totalPages = certificationsData?.totalPages || 1;
  
  // Detectar certificações duplicadas/similares
  const duplicates = detectDuplicates(certifications);
  const duplicateCount = Object.keys(duplicates).length;

  // Função para gerar números de página
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      const end = Math.min(totalPages, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (start > 1) {
        pages.unshift('...');
        pages.unshift(1);
      }
      
      if (end < totalPages) {
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/certificacoes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      toast.success('Certificação criada com sucesso!');
      setIsCreateDialogOpen(false);
      setNewCertification({
        aluno: '',
        cpf: '',
        modalidade: 'Presencial',
        curso: '',
        cargaHoraria: '',
        financeiro: '',
        documentacao: '',
        plataforma: '',
        tutoria: '',
        observacao: '',
        inicioCertificacao: '',
        dataPrevista: '',
        dataEntrega: '',
        diploma: '',
        status: 'pendente',
        categoria: getCategoriaFromTab(activeTab),
        subcategoria: '',
        tcc: 'nao_possui',
        praticasPedagogicas: 'nao_possui',
        estagio: 'nao_possui'
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar certificação');
      console.error('Erro:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/certificacoes/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      toast.success('Certificação atualizada com sucesso!');
      setSelectedCertification(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar certificação');
      console.error('Erro:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/certificacoes/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      toast.success('Certificação excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir certificação');
      console.error('Erro:', error);
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/cursos-pre-cadastrados', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cursos-pre-cadastrados'] });
      toast.success('Curso criado com sucesso!');
      setIsNewCourseDialogOpen(false);
      // Selecionar automaticamente o novo curso
      setNewCertification({ 
        ...newCertification, 
        curso: newCourse.nome,
        cargaHoraria: newCourse.cargaHoraria.toString()
      });
      setNewCourseData({ nome: '', cargaHoraria: '' });
    },
    onError: (error) => {
      toast.error('Erro ao criar curso');
      console.error('Erro:', error);
    }
  });

  const handleCreateCertification = () => {
    if (!newCertification.aluno || !newCertification.cpf || !newCertification.curso) {
      toast.error('Por favor, preencha os campos obrigatórios');
      return;
    }
    
    // Converter cargaHoraria para número antes de enviar
    const certificationData = {
      ...newCertification,
      cargaHoraria: newCertification.cargaHoraria ? parseInt(newCertification.cargaHoraria, 10) : null
    };
    
    createMutation.mutate(certificationData);
  };

  const handleUpdateCertification = (certification: Certification) => {
    // Converter cargaHoraria para número antes de enviar
    const certificationData = {
      ...certification,
      cargaHoraria: certification.cargaHoraria ? 
        (typeof certification.cargaHoraria === 'string' ? parseInt(certification.cargaHoraria, 10) : certification.cargaHoraria) 
        : null
    };
    
    updateMutation.mutate(certificationData);
  };

  const handleDeleteCertification = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta certificação?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateNewCourse = () => {
    if (!newCourseData.nome || !newCourseData.cargaHoraria) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!newCertification.modalidade) {
      toast.error('Selecione uma modalidade antes de criar um curso');
      return;
    }

    const categoria = getCategoriaFromModalidade(newCertification.modalidade);
    const area = getAreaFromCourse(newCourseData.nome);

    const courseData = {
      nome: newCourseData.nome,
      modalidade: newCertification.modalidade,
      categoria: categoria,
      cargaHoraria: parseInt(newCourseData.cargaHoraria),
      area: area,
      ativo: true
    };

    createCourseMutation.mutate(courseData);
  };

  const getAreaFromCourse = (courseName: string): string => {
    const lowerName = courseName.toLowerCase();
    if (lowerName.includes('matemática') || lowerName.includes('física') || lowerName.includes('química')) {
      return 'Ciências Exatas';
    } else if (lowerName.includes('história') || lowerName.includes('geografia') || lowerName.includes('filosofia') || lowerName.includes('sociologia') || lowerName.includes('ciências da religião')) {
      return 'Ciências Humanas';
    } else if (lowerName.includes('letras') || lowerName.includes('português') || lowerName.includes('inglês') || lowerName.includes('espanhol') || lowerName.includes('libras')) {
      return 'Letras';
    } else if (lowerName.includes('educação física')) {
      return 'Educação Física';
    } else if (lowerName.includes('artes') || lowerName.includes('música')) {
      return 'Artes';
    } else if (lowerName.includes('ciências biológicas') || lowerName.includes('biologia')) {
      return 'Ciências Biológicas';
    } else {
      return 'Educação';
    }
  };

  // Agora a busca é feita no backend, então usamos diretamente os dados retornados
  const filteredCertifications = certifications;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            {/* Header com seta de retorno */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDashboard}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Análises Certificações</h1>
                  <p className="text-gray-600">Gerencie certificações e processos de documentação</p>
                </div>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Certificação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nova Certificação</DialogTitle>
                  </DialogHeader>
                  {/* Campo de Status em destaque no topo */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label htmlFor="status" className="text-lg font-semibold text-blue-800">Status da Certificação</Label>
                    <Select value={newCertification.status} onValueChange={(value) => setNewCertification({ ...newCertification, status: value })}>
                      <SelectTrigger className="mt-2 h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="em_andamento">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            Em Andamento
                          </div>
                        </SelectItem>
                        <SelectItem value="concluido">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Concluído
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelado">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            Cancelado
                          </div>
                        </SelectItem>
                        <SelectItem value="em_atraso">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                            Em Atraso
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="aluno">Aluno *</Label>
                      <Input
                        id="aluno"
                        value={newCertification.aluno}
                        onChange={(e) => setNewCertification({ ...newCertification, aluno: e.target.value })}
                        placeholder="Nome do aluno"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={newCertification.cpf}
                        onChange={(e) => setNewCertification({ ...newCertification, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="modalidade">Formato de Entrega</Label>
                      <Select value={newCertification.modalidade} onValueChange={(value) => setNewCertification({ ...newCertification, modalidade: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="EAD">EAD (Ensino a Distância)</SelectItem>
                          <SelectItem value="Híbrido">Híbrido (Presencial + EAD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="curso">Curso *</Label>
                      <div className="flex gap-2">
                        <Popover open={courseSearchOpen} onOpenChange={setCourseSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={courseSearchOpen}
                              className="flex-1 justify-between text-left"
                            >
                              <span className="truncate">{newCertification.curso || "Selecione um curso..."}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[600px] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar curso..." />
                              <CommandList className="max-h-60">
                                <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {preRegisteredCourses.map((course) => (
                                    <CommandItem
                                      key={course.id}
                                      value={course.nome}
                                      onSelect={(currentValue) => {
                                        const selectedCourse = preRegisteredCourses.find(c => c.nome === currentValue);
                                        setNewCertification({ 
                                          ...newCertification, 
                                          curso: currentValue,
                                          cargaHoraria: selectedCourse ? selectedCourse.cargaHoraria.toString() : ''
                                        });
                                        setCourseSearchOpen(false);
                                      }}
                                      className="text-sm"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 shrink-0",
                                          newCertification.curso === course.nome ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{course.nome}</span>
                                        <span className="text-xs text-gray-500">{course.cargaHoraria}h - {course.area}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsNewCourseDialogOpen(true)}
                          title="Adicionar novo curso"
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cargaHoraria">Carga Horária</Label>
                      <Input
                        id="cargaHoraria"
                        type="number"
                        value={newCertification.cargaHoraria}
                        onChange={(e) => setNewCertification({ ...newCertification, cargaHoraria: e.target.value })}
                        placeholder="Horas"
                        disabled={!!newCertification.curso}
                      />
                    </div>
                    {(activeTab === 'segunda' || activeTab === 'formacao_pedagogica') && (
                      <div>
                        <Label htmlFor="subcategoria">Subcategoria</Label>
                        <Select value={newCertification.subcategoria} onValueChange={(value) => setNewCertification({ ...newCertification, subcategoria: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                            <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                            <SelectItem value="pedagogia_bachareis">Pedagogia para Bacharéis e Tecnólogos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="dataPrevista">Data Inicio Certificação</Label>
                      <Input
                        id="dataPrevista"
                        type="date"
                        value={newCertification.dataPrevista}
                        onChange={(e) => setNewCertification({ ...newCertification, dataPrevista: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataEntrega">Data Entrega Certificação</Label>
                      <Input
                        id="dataEntrega"
                        type="date"
                        value={newCertification.dataEntrega}
                        onChange={(e) => setNewCertification({ ...newCertification, dataEntrega: e.target.value })}
                      />
                    </div>

                    {/* Campos de status acadêmico */}
                    <div>
                      <Label htmlFor="documentacao">Documentação</Label>
                      <Select value={newCertification.documentacao} onValueChange={(value) => setNewCertification({ ...newCertification, documentacao: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status da Documentação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              Pendente
                            </div>
                          </SelectItem>
                          <SelectItem value="aprovada">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              Aprovada
                            </div>
                          </SelectItem>
                          <SelectItem value="reprovada">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              Reprovada
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="plataforma">Atividades Plataforma</Label>
                      <Select value={newCertification.plataforma} onValueChange={(value) => setNewCertification({ ...newCertification, plataforma: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status das Atividades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              Pendente
                            </div>
                          </SelectItem>
                          <SelectItem value="aprovada">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              Aprovada
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="financeiro">Financeiro</Label>
                      <Select value={newCertification.financeiro} onValueChange={(value) => setNewCertification({ ...newCertification, financeiro: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status Financeiro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_dia">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              Em dia
                            </div>
                          </SelectItem>
                          <SelectItem value="quitado">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                              Quitado
                            </div>
                          </SelectItem>
                          <SelectItem value="inadimplente">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              Inadimplente
                            </div>
                          </SelectItem>
                          <SelectItem value="expirado">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                              Expirado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campos acadêmicos existentes */}
                    <div>
                      <Label htmlFor="tcc">TCC</Label>
                      <Select value={newCertification.tcc} onValueChange={(value) => setNewCertification({ ...newCertification, tcc: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status do TCC" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_possui">Não Possui</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="reprovado">Reprovado</SelectItem>
                          <SelectItem value="em_correcao">Em Correção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="praticasPedagogicas">Práticas Pedagógicas</Label>
                      <Select value={newCertification.praticasPedagogicas} onValueChange={(value) => setNewCertification({ ...newCertification, praticasPedagogicas: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status das Práticas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_possui">Não Possui</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="reprovado">Reprovado</SelectItem>
                          <SelectItem value="em_correcao">Em Correção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="estagio">Estágio</Label>
                      <Select value={newCertification.estagio} onValueChange={(value) => setNewCertification({ ...newCertification, estagio: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status do Estágio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_possui">Não Possui</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="reprovado">Reprovado</SelectItem>
                          <SelectItem value="em_correcao">Em Correção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label htmlFor="observacao">Observação</Label>
                      <Textarea
                        id="observacao"
                        value={newCertification.observacao}
                        onChange={(e) => setNewCertification({ ...newCertification, observacao: e.target.value })}
                        placeholder="Observações adicionais"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateCertification} disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap gap-1 p-1 h-auto min-h-[48px] bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="pos" 
                  className="flex-1 min-w-[120px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Pós-graduação
                </TabsTrigger>
                <TabsTrigger 
                  value="segunda" 
                  className="flex-1 min-w-[140px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Segunda licenciatura
                </TabsTrigger>
                <TabsTrigger 
                  value="formacao_pedagogica" 
                  className="flex-1 min-w-[130px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Form. Pedagógica
                </TabsTrigger>
                <TabsTrigger 
                  value="formacao_livre" 
                  className="flex-1 min-w-[110px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Form. Livre
                </TabsTrigger>
                <TabsTrigger 
                  value="diplomacao" 
                  className="flex-1 min-w-[140px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Diplom. Competência
                </TabsTrigger>
                <TabsTrigger 
                  value="eja" 
                  className="flex-1 min-w-[60px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  EJA
                </TabsTrigger>
                <TabsTrigger 
                  value="graduacao" 
                  className="flex-1 min-w-[90px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Graduação
                </TabsTrigger>
                <TabsTrigger 
                  value="capacitacao" 
                  className="flex-1 min-w-[100px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Capacitação
                </TabsTrigger>
                <TabsTrigger 
                  value="sequencial" 
                  className="flex-1 min-w-[90px] px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Sequencial
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {/* Alerta de Duplicatas */}
                {duplicateCount > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Atenção:</strong> Detectados {duplicateCount} {duplicateCount === 1 ? 'aluno com cursos similares' : 'alunos com cursos similares'}. 
                      {Object.entries(duplicates).map(([key, certs]) => {
                        const aluno = certs[0].aluno;
                        const cursos = certs.map(c => c.curso).join(', ');
                        return ` ${aluno}: ${cursos}.`;
                      }).join('')}
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <Label htmlFor="search">Buscar</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="search"
                            placeholder="Nome, CPF ou curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="filter-status">Status</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                            <SelectItem value="em_atraso">Em Atraso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="filter-modalidade">Formato de Entrega</Label>
                        <Select value={filterModalidade} onValueChange={setFilterModalidade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os formatos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todos</SelectItem>
                            <SelectItem value="Presencial">Presencial</SelectItem>
                            <SelectItem value="EAD">EAD (Ensino a Distância)</SelectItem>
                            <SelectItem value="Híbrido">Híbrido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="filter-periodo">Período</Label>
                        <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os períodos</SelectItem>
                            <SelectItem value="hoje">Hoje</SelectItem>
                            <SelectItem value="semana">Esta Semana</SelectItem>
                            <SelectItem value="mes">Este Mês</SelectItem>
                            <SelectItem value="mes_passado">Mês Passado</SelectItem>
                            <SelectItem value="personalizado">Período Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {filterPeriodo === 'personalizado' && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="dataInicio">Data Início</Label>
                          <Input
                            id="dataInicio"
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dataFim">Data Fim</Label>
                          <Input
                            id="dataFim"
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contador de Resultados e Controles de Paginação */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {isLoading ? (
                      "Carregando..."
                    ) : (
                      <>
                        Exibindo <strong>{(currentPage - 1) * pageSize + 1}</strong> a <strong>{Math.min(currentPage * pageSize, totalCertifications)}</strong> de <strong>{totalCertifications}</strong> certificação{totalCertifications !== 1 ? 'ões' : ''} 
                        {searchTerm && ` para "${searchTerm}"`}
                        {filterStatus && filterStatus !== 'todos' && ` com status "${STATUS_LABELS[filterStatus as keyof typeof STATUS_LABELS]}"`}
                        {filterModalidade && filterModalidade !== 'todas' && ` no formato "${filterModalidade}"`}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size" className="text-sm">Mostrar:</Label>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certifications.map((certification: Certification) => {
                      // Verificar se esta certificação está em algum grupo de duplicatas
                      const isDuplicate = Object.values(duplicates).some(group => 
                        group.some(cert => cert.id === certification.id)
                      );
                      
                      return (
                        <Card key={certification.id} className={`hover:shadow-md transition-shadow ${isDuplicate ? 'border-orange-300 bg-orange-50' : ''}`}>
                          <CardContent className="p-6">
                            {isDuplicate && (
                              <div className="mb-3 flex items-center gap-2 text-orange-700 text-sm font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                Possível duplicata detectada
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-semibold text-lg">{certification.aluno}</div>
                                  <Badge className={STATUS_COLORS[certification.status as keyof typeof STATUS_COLORS]}>
                                    {STATUS_LABELS[certification.status as keyof typeof STATUS_LABELS]}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">CPF: {certification.cpf}</div>
                                <div className="text-sm text-gray-600">Curso: {certification.curso}</div>
                                {certification.cargaHoraria && (
                                  <div className="text-sm text-gray-600">Carga Horária: {certification.cargaHoraria}h</div>
                                )}
                                {(activeTab === 'segunda' || activeTab === 'formacao_pedagogica') && certification.subcategoria && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {SUBCATEGORIA_LABELS[certification.subcategoria as keyof typeof SUBCATEGORIA_LABELS]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Formato</div>
                                <div className="text-sm">{certification.modalidade}</div>
                                <div className="text-sm font-medium text-gray-700 mt-2">Financeiro</div>
                                <div className="text-sm">{certification.financeiro}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Data Inicio Certificação</div>
                                <div className="text-sm">{formatDate(certification.dataPrevista)}</div>
                                <div className="text-sm font-medium text-gray-700 mt-2">Data Entrega Certificação</div>
                                <div className="text-sm">{formatDate(certification.dataEntrega)}</div>
                              </div>
                              <div>
                                {/* Campos acadêmicos específicos */}
                                <div className="mt-2 space-y-1">
                                  {certification.tcc && certification.tcc !== 'nao_possui' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">TCC:</span>
                                      <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.tcc as keyof typeof ACADEMIC_STATUS_COLORS]}`}>
                                        {ACADEMIC_STATUS_LABELS[certification.tcc as keyof typeof ACADEMIC_STATUS_LABELS]}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {certification.praticasPedagogicas && certification.praticasPedagogicas !== 'nao_possui' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">Práticas:</span>
                                      <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.praticasPedagogicas as keyof typeof ACADEMIC_STATUS_COLORS]}`}>
                                        {ACADEMIC_STATUS_LABELS[certification.praticasPedagogicas as keyof typeof ACADEMIC_STATUS_LABELS]}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {certification.estagio && certification.estagio !== 'nao_possui' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">Estágio:</span>
                                      <Badge variant="outline" className={`text-xs ${ACADEMIC_STATUS_COLORS[certification.estagio as keyof typeof ACADEMIC_STATUS_COLORS]}`}>
                                        {ACADEMIC_STATUS_LABELS[certification.estagio as keyof typeof ACADEMIC_STATUS_LABELS]}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                {certification.observacao && (
                                  <div className="text-sm text-gray-600 mt-2">
                                    <strong>Obs:</strong> {certification.observacao}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCertification(certification)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCertification(certification.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                    
                    {certifications.length === 0 && (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <div className="text-lg font-medium text-gray-900">
                            {activeTab === 'eja' ? 'Categoria EJA não possui certificações' : 'Nenhuma certificação encontrada'}
                          </div>
                          <div className="text-gray-600">
                            {activeTab === 'eja' 
                              ? 'Esta categoria está vazia. Verifique se os dados foram importados corretamente ou crie uma nova certificação EJA.'
                              : 'Crie uma nova certificação para começar'
                            }
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Componente de Paginação */}
                {!isLoading && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((pageNum, index) => (
                          <div key={index}>
                            {pageNum === '...' ? (
                              <span className="px-2 py-1 text-gray-500">...</span>
                            ) : (
                              <Button
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className="min-w-[40px]"
                                onClick={() => handlePageChange(pageNum as number)}
                              >
                                {pageNum}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      {/* Dialog de Edição */}
      <Dialog open={!!selectedCertification} onOpenChange={() => setSelectedCertification(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Certificação</DialogTitle>
          </DialogHeader>
          {selectedCertification && (
            <>
              {/* Campo de Status em destaque no topo */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label htmlFor="edit-status" className="text-lg font-semibold text-blue-800">Status da Certificação</Label>
                <Select value={selectedCertification.status} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, status: value })}>
                  <SelectTrigger className="mt-2 h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="em_andamento">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        Em Andamento
                      </div>
                    </SelectItem>
                    <SelectItem value="concluido">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Concluído
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelado">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        Cancelado
                      </div>
                    </SelectItem>
                    <SelectItem value="em_atraso">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        Em Atraso
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="edit-aluno">Aluno</Label>
                  <Input
                    id="edit-aluno"
                    value={selectedCertification.aluno}
                    onChange={(e) => setSelectedCertification({ ...selectedCertification, aluno: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input
                    id="edit-cpf"
                    value={selectedCertification.cpf}
                    onChange={(e) => setSelectedCertification({ ...selectedCertification, cpf: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-modalidade">Formato de Entrega</Label>
                  <Select value={selectedCertification.modalidade} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, modalidade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presencial">Presencial</SelectItem>
                      <SelectItem value="EAD">EAD (Ensino a Distância)</SelectItem>
                      <SelectItem value="Híbrido">Híbrido (Presencial + EAD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div className="col-span-2">
                <Label htmlFor="edit-curso">Curso</Label>
                <Popover open={editCourseSearchOpen} onOpenChange={setEditCourseSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editCourseSearchOpen}
                      className="w-full justify-between text-left"
                    >
                      <span className="truncate">{selectedCertification.curso || "Selecione um curso..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar curso..." />
                      <CommandList className="max-h-60">
                        <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                        <CommandGroup>
                          {editPreRegisteredCourses.map((course) => (
                            <CommandItem
                              key={course.id}
                              value={course.nome}
                              onSelect={(currentValue) => {
                                const selectedCourse = editPreRegisteredCourses.find(c => c.nome === currentValue);
                                setSelectedCertification({ 
                                  ...selectedCertification, 
                                  curso: currentValue,
                                  cargaHoraria: selectedCourse ? selectedCourse.cargaHoraria.toString() : selectedCertification.cargaHoraria
                                });
                                setEditCourseSearchOpen(false);
                              }}
                              className="text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  selectedCertification.curso === course.nome ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{course.nome}</span>
                                <span className="text-xs text-gray-500">{course.cargaHoraria}h - {course.area}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="edit-cargaHoraria">Carga Horária</Label>
                <Input
                  id="edit-cargaHoraria"
                  type="number"
                  value={selectedCertification.cargaHoraria || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, cargaHoraria: e.target.value })}
                  placeholder="Horas"
                />
              </div>
              {(activeTab === 'segunda' || activeTab === 'formacao_pedagogica') && (
                <div>
                  <Label htmlFor="edit-subcategoria">Subcategoria</Label>
                  <Select value={selectedCertification.subcategoria || ''} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, subcategoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                      <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                      <SelectItem value="pedagogia_bachareis">Pedagogia para Bacharéis e Tecnólogos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="edit-dataPrevista">Data Inicio Certificação</Label>
                <Input
                  id="edit-dataPrevista"
                  type="date"
                  value={selectedCertification.dataPrevista || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, dataPrevista: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-dataEntrega">Data Entrega Certificação</Label>
                <Input
                  id="edit-dataEntrega"
                  type="date"
                  value={selectedCertification.dataEntrega || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, dataEntrega: e.target.value })}
                />
              </div>

              {/* Campos de status acadêmico */}
              <div>
                <Label htmlFor="edit-documentacao">Documentação</Label>
                <Select value={selectedCertification.documentacao || 'pendente'} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, documentacao: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="aprovada">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Aprovada
                      </div>
                    </SelectItem>
                    <SelectItem value="reprovada">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        Reprovada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-plataforma">Atividades Plataforma</Label>
                <Select value={selectedCertification.plataforma || 'pendente'} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, plataforma: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        Pendente
                      </div>
                    </SelectItem>
                    <SelectItem value="aprovada">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Aprovada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-financeiro">Financeiro</Label>
                <Select value={selectedCertification.financeiro || 'em_dia'} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, financeiro: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_dia">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Em dia
                      </div>
                    </SelectItem>
                    <SelectItem value="quitado">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        Quitado
                      </div>
                    </SelectItem>
                    <SelectItem value="inadimplente">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        Inadimplente
                      </div>
                    </SelectItem>
                    <SelectItem value="expirado">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                        Expirado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos acadêmicos existentes */}
              <div>
                <Label htmlFor="edit-tcc">TCC</Label>
                <Select value={selectedCertification.tcc || 'nao_possui'} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, tcc: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_possui">Não Possui</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                    <SelectItem value="em_correcao">Em Correção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-praticasPedagogicas">Práticas Pedagógicas</Label>
                <Select value={selectedCertification.praticasPedagogicas || 'nao_possui'} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, praticasPedagogicas: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_possui">Não Possui</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                    <SelectItem value="em_correcao">Em Correção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-estagio">Estágio</Label>
                <Select value={selectedCertification.estagio || 'nao_possui'} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, estagio: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_possui">Não Possui</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                    <SelectItem value="em_correcao">Em Correção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <Label htmlFor="edit-observacao">Observação</Label>
                <Textarea
                  id="edit-observacao"
                  value={selectedCertification.observacao || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, observacao: e.target.value })}
                />
              </div>
              </div>
            </>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedCertification(null)}>
              Cancelar
            </Button>
            <Button onClick={() => selectedCertification && handleUpdateCertification(selectedCertification)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal para criar novo curso */}
      <Dialog open={isNewCourseDialogOpen} onOpenChange={setIsNewCourseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-course-name">Nome do Curso *</Label>
              <Input
                id="new-course-name"
                value={newCourseData.nome}
                onChange={(e) => setNewCourseData({ ...newCourseData, nome: e.target.value })}
                placeholder="Ex: Licenciatura em História"
              />
            </div>
            <div>
              <Label htmlFor="new-course-hours">Carga Horária (em horas) *</Label>
              <Input
                id="new-course-hours"
                type="number"
                value={newCourseData.cargaHoraria}
                onChange={(e) => setNewCourseData({ ...newCourseData, cargaHoraria: e.target.value })}
                placeholder="Ex: 1320"
              />
            </div>
            {newCertification.modalidade && (
              <div className="text-sm text-gray-600">
                <strong>Modalidade:</strong> {newCertification.modalidade}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsNewCourseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewCourse} disabled={createCourseMutation.isPending}>
              {createCourseMutation.isPending ? 'Criando...' : 'Criar Curso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}