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
import { Plus, Search, Edit, Trash2, FileText, Calendar } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const queryClient = useQueryClient();

  const getCategoriaFromTab = (tab: string) => {
    switch(tab) {
      case 'pos': return 'pos_graduacao';
      case 'segunda': return 'segunda_graduacao';
      case 'formacao_livre': return 'formacao_livre';
      case 'eja': return 'eja';
      default: return 'pos_graduacao';
    }
  };

  const [newCertification, setNewCertification] = useState({
    aluno: '',
    cpf: '',
    modalidade: '',
    curso: '',
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
    subcategoria: ''
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

  // Função para calcular datas baseadas no período selecionado
  const getDateRange = () => {
    const hoje = new Date();
    switch (filterPeriodo) {
      case 'hoje':
        return {
          inicio: format(startOfDay(hoje), 'yyyy-MM-dd'),
          fim: format(endOfDay(hoje), 'yyyy-MM-dd')
        };
      case 'semana':
        return {
          inicio: format(startOfWeek(hoje, { locale: ptBR }), 'yyyy-MM-dd'),
          fim: format(endOfWeek(hoje, { locale: ptBR }), 'yyyy-MM-dd')
        };
      case 'mes':
        return {
          inicio: format(startOfMonth(hoje), 'yyyy-MM-dd'),
          fim: format(endOfMonth(hoje), 'yyyy-MM-dd')
        };
      case 'mes_passado':
        const mesPassado = subMonths(hoje, 1);
        return {
          inicio: format(startOfMonth(mesPassado), 'yyyy-MM-dd'),
          fim: format(endOfMonth(mesPassado), 'yyyy-MM-dd')
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
        subcategoria: ''
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar certificação');
      console.error('Erro:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/certificacoes/${id}`, {
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
    createMutation.mutate(newCertification);
  };

  const handleUpdateCertification = (certification: Certification) => {
    updateMutation.mutate({ 
      id: certification.id, 
      data: certification 
    });
  };

  const handleDeleteCertification = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta certificação?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCertifications = certifications.filter((cert: Certification) => {
    const matchesSearch = 
      cert.aluno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.cpf.includes(searchTerm) ||
      cert.curso.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificações</h1>
          <p className="text-gray-600">Gerencie certificações e processos de documentação</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Certificação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Certificação</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="EAD">EAD</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                    <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="curso">Curso *</Label>
                <Input
                  id="curso"
                  value={newCertification.curso}
                  onChange={(e) => setNewCertification({ ...newCertification, curso: e.target.value })}
                  placeholder="Nome do curso"
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
                <Label htmlFor="status">Status</Label>
                <Select value={newCertification.status} onValueChange={(value) => setNewCertification({ ...newCertification, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataPrevista">Data Prevista</Label>
                <Input
                  id="dataPrevista"
                  type="date"
                  value={newCertification.dataPrevista}
                  onChange={(e) => setNewCertification({ ...newCertification, dataPrevista: e.target.value })}
                />
              </div>
              <div className="col-span-2">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pos">Certificação Pós</TabsTrigger>
          <TabsTrigger value="segunda">2ª Graduação</TabsTrigger>
          <TabsTrigger value="formacao_livre">Formação Livre</TabsTrigger>
          <TabsTrigger value="eja">EJA</TabsTrigger>
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
                      <SelectItem value="EAD">EAD</SelectItem>
                      <SelectItem value="Presencial">Presencial</SelectItem>
                      <SelectItem value="Semipresencial">Semipresencial</SelectItem>
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

      {/* Dialog para edição */}
      <Dialog open={!!selectedCertification} onOpenChange={() => setSelectedCertification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Certificação</DialogTitle>
          </DialogHeader>
          {selectedCertification && (
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="EAD">EAD</SelectItem>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                    <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-curso">Curso</Label>
                <Input
                  id="edit-curso"
                  value={selectedCertification.curso}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, curso: e.target.value })}
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
                <Label htmlFor="edit-status">Status</Label>
                <Select value={selectedCertification.status} onValueChange={(value) => setSelectedCertification({ ...selectedCertification, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-dataPrevista">Data Prevista</Label>
                <Input
                  id="edit-dataPrevista"
                  type="date"
                  value={selectedCertification.dataPrevista || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, dataPrevista: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-observacao">Observação</Label>
                <Textarea
                  id="edit-observacao"
                  value={selectedCertification.observacao || ''}
                  onChange={(e) => setSelectedCertification({ ...selectedCertification, observacao: e.target.value })}
                />
              </div>
            </div>
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