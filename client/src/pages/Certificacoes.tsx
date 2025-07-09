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

const STATUS_COLORS = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'em_andamento': 'bg-blue-100 text-blue-800',
  'concluido': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'concluido': 'Concluído',
  'cancelado': 'Cancelado'
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
  const [filterSubcategoria, setFilterSubcategoria] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [editCourseSearchOpen, setEditCourseSearchOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const getCategoriaFromTab = (tab: string) => {
    switch(tab) {
      case 'pos': return 'pos_graduacao';
      case 'segunda': return 'segunda_graduacao';
      case 'formacao_livre': return 'formacao_livre';
      case 'diplomacao': return 'diplomacao_competencia';
      case 'eja': return 'eja';
      case 'graduacao': return 'graduacao';
      case 'capacitacao': return 'capacitacao';
      case 'sequencial': return 'sequencial';
      default: return 'pos_graduacao';
    }
  };

  const [newCertification, setNewCertification] = useState({
    aluno: '',
    cpf: '',
    modalidade: '',
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

  // Limpar filtros quando a aba muda
  useEffect(() => {
    setFilterStatus('');
    setFilterModalidade('');
    setFilterSubcategoria('');
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
        return 'segunda_graduacao';
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
  const { data: preRegisteredCourses = [] } = useQuery({
    queryKey: ['/api/cursos-pre-cadastrados', { categoria: getCategoriaFromModalidade(newCertification.modalidade), modalidade: newCertification.modalidade }],
    queryFn: async () => {
      const categoria = getCategoriaFromModalidade(newCertification.modalidade);
      const params = new URLSearchParams({
        categoria: categoria
      });
      
      if (newCertification.modalidade) {
        params.append('modalidade', newCertification.modalidade);
      }
      
      console.log('🔍 Buscando cursos com parâmetros:', { 
        categoria: categoria, 
        modalidade: newCertification.modalidade,
        url: `/api/cursos-pre-cadastrados?${params}`
      });
      
      const response = await apiRequest(`/api/cursos-pre-cadastrados?${params}`);
      console.log('📚 Cursos recebidos:', response.length);
      return response;
    }
  });

  // Query para buscar cursos pré-cadastrados para edição
  const { data: editPreRegisteredCourses = [] } = useQuery({
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

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['/api/certificacoes', { 
      categoria: getCategoriaFromTab(activeTab),
      status: filterStatus,
      modalidade: filterModalidade,
      subcategoria: filterSubcategoria,
      periodo: filterPeriodo,
      dataInicio,
      dataFim
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        categoria: getCategoriaFromTab(activeTab)
      });
      
      if (filterStatus && filterStatus !== 'todos') params.append('status', filterStatus);
      if (filterModalidade && filterModalidade !== 'todas') params.append('modalidade', filterModalidade);
      if (filterSubcategoria && filterSubcategoria !== 'todas') params.append('subcategoria', filterSubcategoria);
      
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
        modalidade: '',
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

  const handleCreateCertification = () => {
    if (!newCertification.aluno || !newCertification.cpf || !newCertification.curso) {
      toast.error('Por favor, preencha os campos obrigatórios');
      return;
    }
    createMutation.mutate(newCertification);
  };

  const handleUpdateCertification = (certification: Certification) => {
    updateMutation.mutate(certification);
  };

  const handleDeleteCertification = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta certificação?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCertifications = certifications.filter((cert: Certification) => {
    const matchesSearch = 
      (cert.aluno && cert.aluno.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cert.cpf && cert.cpf.includes(searchTerm)) ||
      (cert.curso && cert.curso.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filterStatus || filterStatus === 'all' || cert.status === filterStatus;
    const matchesModalidade = !filterModalidade || filterModalidade === 'all' || cert.modalidade === filterModalidade;
    
    return matchesSearch && matchesStatus && matchesModalidade;
  });

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
                  <h1 className="text-2xl font-bold">Certificações</h1>
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
                      <Label htmlFor="modalidade">Modalidade</Label>
                      <Select value={newCertification.modalidade} onValueChange={(value) => setNewCertification({ ...newCertification, modalidade: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a modalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Segunda licenciatura">Segunda licenciatura</SelectItem>
                          <SelectItem value="Formação Pedagógica">Formação Pedagógica</SelectItem>
                          <SelectItem value="EJA">EJA</SelectItem>
                          <SelectItem value="Diplomação por competência">Diplomação por competência</SelectItem>
                          <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                          <SelectItem value="Formação livre">Formação livre</SelectItem>
                          <SelectItem value="Graduação">Graduação</SelectItem>
                          <SelectItem value="Capacitação">Capacitação</SelectItem>
                          <SelectItem value="Sequencial">Sequencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="curso">Curso *</Label>
                      <Popover open={courseSearchOpen} onOpenChange={setCourseSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={courseSearchOpen}
                            className="w-full justify-between text-left"
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
                    {activeTab === 'segunda' && (
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
                      <Label htmlFor="dataPrevista">Data Prevista</Label>
                      <Input
                        id="dataPrevista"
                        type="date"
                        value={newCertification.dataPrevista}
                        onChange={(e) => setNewCertification({ ...newCertification, dataPrevista: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataEntrega">Data de Entrega</Label>
                      <Input
                        id="dataEntrega"
                        type="date"
                        value={newCertification.dataEntrega}
                        onChange={(e) => setNewCertification({ ...newCertification, dataEntrega: e.target.value })}
                      />
                    </div>

                    {/* Novos campos adicionais */}
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
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="pos">Pós-graduação</TabsTrigger>
                <TabsTrigger value="segunda">Segunda licenciatura</TabsTrigger>
                <TabsTrigger value="formacao_livre">Formação livre</TabsTrigger>
                <TabsTrigger value="diplomacao">Diplomação por competência</TabsTrigger>
                <TabsTrigger value="eja">EJA</TabsTrigger>
                <TabsTrigger value="graduacao">Graduação</TabsTrigger>
                <TabsTrigger value="capacitacao">Capacitação</TabsTrigger>
                <TabsTrigger value="sequencial">Sequencial</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`grid grid-cols-1 gap-4 ${activeTab === 'segunda' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="filter-modalidade">Modalidade</Label>
                        <Select value={filterModalidade} onValueChange={setFilterModalidade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as modalidades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas</SelectItem>
                            <SelectItem value="Segunda licenciatura">Segunda licenciatura</SelectItem>
                            <SelectItem value="Formação Pedagógica">Formação Pedagógica</SelectItem>
                            <SelectItem value="EJA">EJA</SelectItem>
                            <SelectItem value="Diplomação por competência">Diplomação por competência</SelectItem>
                            <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                            <SelectItem value="Formação livre">Formação livre</SelectItem>
                            <SelectItem value="Graduação">Graduação</SelectItem>
                            <SelectItem value="Capacitação">Capacitação</SelectItem>
                            <SelectItem value="Sequencial">Sequencial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {activeTab === 'segunda' && (
                        <div>
                          <Label htmlFor="filter-subcategoria">Subcategoria</Label>
                          <Select value={filterSubcategoria} onValueChange={setFilterSubcategoria}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas as subcategorias" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas</SelectItem>
                              <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                              <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                              <SelectItem value="pedagogia_bachareis">Pedagogia para Bacharéis e Tecnólogos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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

                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCertifications.map((certification: Certification) => (
                      <Card key={certification.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                              <div>
                                <div className="font-semibold text-lg">{certification.aluno}</div>
                                <div className="text-sm text-gray-600">CPF: {certification.cpf}</div>
                                <div className="text-sm text-gray-600">Curso: {certification.curso}</div>
                                {certification.cargaHoraria && (
                                  <div className="text-sm text-gray-600">Carga Horária: {certification.cargaHoraria}h</div>
                                )}
                                {activeTab === 'segunda' && certification.subcategoria && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {SUBCATEGORIA_LABELS[certification.subcategoria as keyof typeof SUBCATEGORIA_LABELS]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Modalidade</div>
                                <div className="text-sm">{certification.modalidade}</div>
                                <div className="text-sm font-medium text-gray-700 mt-2">Financeiro</div>
                                <div className="text-sm">{certification.financeiro}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Data Prevista</div>
                                <div className="text-sm">{formatDate(certification.dataPrevista)}</div>
                                <div className="text-sm font-medium text-gray-700 mt-2">Data Entrega</div>
                                <div className="text-sm">{formatDate(certification.dataEntrega)}</div>
                              </div>
                              <div>
                                <Badge className={STATUS_COLORS[certification.status as keyof typeof STATUS_COLORS]}>
                                  {STATUS_LABELS[certification.status as keyof typeof STATUS_LABELS]}
                                </Badge>
                                
                                {/* Novos campos acadêmicos */}
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
                    ))}
                    
                    {filteredCertifications.length === 0 && (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <div className="text-lg font-medium text-gray-900">Nenhuma certificação encontrada</div>
                          <div className="text-gray-600">Crie uma nova certificação para começar</div>
                        </CardContent>
                      </Card>
                    )}
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
                  <Label htmlFor="edit-modalidade">Modalidade</Label>
                  <Select value={selectedCertification.modalidade} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, modalidade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Segunda licenciatura">Segunda licenciatura</SelectItem>
                      <SelectItem value="Formação pedagógica">Formação pedagógica</SelectItem>
                      <SelectItem value="EJA">EJA</SelectItem>
                      <SelectItem value="Diplomação por competência">Diplomação por competência</SelectItem>
                      <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                      <SelectItem value="Formação livre">Formação livre</SelectItem>
                      <SelectItem value="Graduação">Graduação</SelectItem>
                      <SelectItem value="Capacitação">Capacitação</SelectItem>
                      <SelectItem value="Sequencial">Sequencial</SelectItem>
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
              {activeTab === 'segunda' && (
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
                <Label htmlFor="edit-dataPrevista">Data Prevista</Label>
                <Input
                  id="edit-dataPrevista"
                  type="date"
                  value={selectedCertification.dataPrevista || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, dataPrevista: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-dataEntrega">Data de Entrega</Label>
                <Input
                  id="edit-dataEntrega"
                  type="date"
                  value={selectedCertification.dataEntrega || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, dataEntrega: e.target.value })}
                />
              </div>

              {/* Novos campos no modal de edição */}
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
    </div>
  );
}