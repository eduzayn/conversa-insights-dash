import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, Trash2, AlertTriangle, ArrowLeft, Copy, CheckCircle2, BarChart3, TrendingUp, Users, DollarSign, Calendar, Target, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Componentes consolidados
import { useCrudOperations } from "@/hooks/useCrudOperations";
import { useFormValidation } from "@/hooks/useFormValidation";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FormDialog } from "@/components/common/FormDialog";
import { LoadingCard } from "@/components/common/LoadingCard";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { VoiceTranscription } from "@/components/common/VoiceTranscription";

interface Negociacao {
  id?: number;
  clienteNome: string;
  clienteEmail?: string;
  clienteCpf?: string;
  clienteTelefone?: string;
  curso?: string;
  categoria?: string;
  cursoReferencia?: string;
  dataNegociacao: string;
  previsaoPagamento: string;
  parcelasAtraso: number | string;
  dataVencimentoMaisAntiga: string;
  valorNegociado?: number;
  gatewayPagamento?: string;
  observacoes: string;
  colaboradorResponsavel: string;
  origem: 'asaas' | 'certificacao';
  status: 'aguardando_pagamento' | 'recebido' | 'acordo_quebrado';
  createdAt?: string;
  updatedAt?: string;
}

interface Expirado {
  id?: number;
  clienteNome: string;
  clienteEmail?: string;
  clienteCpf?: string;
  curso: string;
  categoria: string;
  dataExpiracao: string;
  dataProposta?: string;
  dataPrevisaPagamento: string;
  propostaReativacao?: string;
  valorProposta?: number;
  gatewayPagamento?: string;
  statusProposta: 'pendente' | 'enviada' | 'aceita' | 'rejeitada';
  observacoes: string;
  colaboradorResponsavel: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Quitacao {
  id?: number;
  clienteNome: string;
  clienteCpf: string;
  cursoReferencia: string;
  dataQuitacao: string;
  valorQuitado: number | string;
  dataUltimaParcelaQuitada: string;
  parcelasQuitadas: number | string;
  gatewayPagamento: string;
  colaboradorResponsavel: string;
  status: 'quitado' | 'aguardando_pagamento';
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const Negociacoes: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
  const [selectedExpirado, setSelectedExpirado] = useState<Expirado | null>(null);
  const [selectedQuitacao, setSelectedQuitacao] = useState<Quitacao | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteExpiradoId, setDeleteExpiradoId] = useState<number | null>(null);
  const [deleteQuitacaoId, setDeleteQuitacaoId] = useState<number | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // Estados para dashboard
  const [dashboardDateStart, setDashboardDateStart] = useState('');
  const [dashboardDateEnd, setDashboardDateEnd] = useState('');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState('all');

  const navigate = useNavigate();

  // Hooks consolidados
  const { validateRequired, validateDate, validateFutureDate } = useFormValidation();
  
  const negociacoesCrud = useCrudOperations<Negociacao>({
    entityName: 'Negociação',
    endpoint: '/api/negociacoes',
    queryKeys: ['/api/negociacoes']
  });

  const expiradosCrud = useCrudOperations<Expirado>({
    entityName: 'Curso Expirado',
    endpoint: '/api/negociacoes-expirados',
    queryKeys: ['/api/negociacoes-expirados']
  });

  const quitacoesCrud = useCrudOperations<Quitacao>({
    entityName: 'Quitação',
    endpoint: '/api/quitacoes',
    queryKeys: ['/api/quitacoes']
  });

  // Função para capturar erros de renderização
  const handleRenderError = (error: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro de renderização capturado:', error);
    }
    setRenderError(error.message);
  };



  // Buscar colaboradores (usuários admin e agentes)
  const { data: colaboradores = [], isLoading: loadingColaboradores } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });

  // Buscar negociações
  const { data: negociacoes = [], isLoading: loadingNegociacoes } = useQuery({
    queryKey: ['/api/negociacoes', { search: searchTerm, status: statusFilter, dataInicio, dataFim }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      return apiRequest(`/api/negociacoes?${params}`);
    }
  });

  // Buscar expirados
  const { data: expirados = [], isLoading: loadingExpirados } = useQuery({
    queryKey: ['/api/negociacoes-expirados', { search: searchTerm, status: statusFilter, dataInicio, dataFim }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      return apiRequest(`/api/negociacoes-expirados?${params}`);
    }
  });

  // Buscar quitações
  const { data: quitacoes = [], isLoading: loadingQuitacoes } = useQuery({
    queryKey: ['/api/quitacoes', { search: searchTerm, status: statusFilter, dataInicio, dataFim }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      return apiRequest(`/api/quitacoes?${params}`);
    }
  });

  // Reset error state quando dados mudam
  useEffect(() => {
    setRenderError(null);
  }, [negociacoes, expirados, quitacoes]);

  // Calcular dados do dashboard usando useMemo (mais seguro que useCallback + useEffect)
  const dashboardData = useMemo(() => {
    if (!negociacoes || !expirados || !quitacoes) return null;

    // Aplicar filtros de data e status
    const filteredNegociacoes = negociacoes.filter(n => {
      // Filtro por status
      if (dashboardStatusFilter && dashboardStatusFilter !== 'all' && n.status !== dashboardStatusFilter) return false;
      
      // Filtro por data
      if (!dashboardDateStart && !dashboardDateEnd) return true;
      const dataItem = n.dataNegociacao;
      if (!dataItem) return true;
      
      if (dashboardDateStart && dataItem < dashboardDateStart) return false;
      if (dashboardDateEnd && dataItem > dashboardDateEnd) return false;
      return true;
    });

    const filteredExpirados = expirados.filter(e => {
      // Filtro por status para expirados
      if (dashboardStatusFilter && dashboardStatusFilter !== 'all') {
        const statusExpirados = ['pendente', 'enviada', 'aceita', 'rejeitada'];
        if (statusExpirados.includes(dashboardStatusFilter) && e.statusProposta !== dashboardStatusFilter) return false;
      }
      
      // Filtro por data
      if (!dashboardDateStart && !dashboardDateEnd) return true;
      const dataItem = e.dataExpiracao;
      if (!dataItem) return true;
      
      if (dashboardDateStart && dataItem < dashboardDateStart) return false;
      if (dashboardDateEnd && dataItem > dashboardDateEnd) return false;
      return true;
    });

    const filteredQuitacoes = quitacoes.filter(q => {
      // Filtro por status para quitações
      if (dashboardStatusFilter && dashboardStatusFilter !== 'all') {
        if (dashboardStatusFilter === 'quitado' && q.status !== 'quitado') return false;
        if (dashboardStatusFilter === 'aguardando_pagamento_quit' && q.status !== 'aguardando_pagamento') return false;
      }
      
      // Filtro por data
      if (!dashboardDateStart && !dashboardDateEnd) return true;
      const dataItem = q.dataQuitacao;
      if (!dataItem) return true;
      
      if (dashboardDateStart && dataItem < dashboardDateStart) return false;
      if (dashboardDateEnd && dataItem > dashboardDateEnd) return false;
      return true;
    });

    // Métricas gerais
    const totalNegociacoes = filteredNegociacoes.length;
    const totalExpirados = filteredExpirados.length;
    const totalQuitacoes = filteredQuitacoes.length;
    
    // Valores totais
    const valorTotalNegociacoes = filteredNegociacoes.reduce((sum, n) => sum + (Number(n.valorNegociado) || 0), 0);
    const valorTotalQuitacoes = filteredQuitacoes.reduce((sum, q) => sum + (Number(q.valorQuitado) || 0), 0);
    const valorTotalExpirados = filteredExpirados.reduce((sum, e) => sum + (Number(e.valorProposta) || 0), 0);
    
    // Status das negociações
    const negociacoesStatus = filteredNegociacoes.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Status dos expirados
    const expiradosStatus = filteredExpirados.reduce((acc, e) => {
      acc[e.statusProposta] = (acc[e.statusProposta] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Status das quitações
    const quitacoesStatus = filteredQuitacoes.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Dados para gráficos
    const statusChartData = [
      { name: 'Negociações', value: totalNegociacoes, color: '#3B82F6' },
      { name: 'Expirados', value: totalExpirados, color: '#EF4444' },
      { name: 'Quitações', value: totalQuitacoes, color: '#10B981' }
    ];
    
    const valueChartData = [
      { name: 'Negociações', value: valorTotalNegociacoes, color: '#3B82F6' },
      { name: 'Expirados', value: valorTotalExpirados, color: '#EF4444' },
      { name: 'Quitações', value: valorTotalQuitacoes, color: '#10B981' }
    ];
    
    // Gráfico de evolução mensal (últimos 6 meses)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const negociacoesMonth = filteredNegociacoes.filter(n => n.dataNegociacao?.startsWith(monthKey)).length;
      const expiradosMonth = filteredExpirados.filter(e => e.dataExpiracao?.startsWith(monthKey)).length;
      const quitacoesMonth = filteredQuitacoes.filter(q => q.dataQuitacao?.startsWith(monthKey)).length;
      
      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        negociacoes: negociacoesMonth,
        expirados: expiradosMonth,
        quitacoes: quitacoesMonth
      });
    }
    
    return {
      totals: {
        negociacoes: totalNegociacoes,
        expirados: totalExpirados,
        quitacoes: totalQuitacoes
      },
      values: {
        negociacoes: valorTotalNegociacoes,
        expirados: valorTotalExpirados,
        quitacoes: valorTotalQuitacoes
      },
      statusData: {
        negociacoes: negociacoesStatus,
        expirados: expiradosStatus,
        quitacoes: quitacoesStatus
      },
      chartData: {
        statusChart: statusChartData,
        valueChart: valueChartData,
        monthlyChart: monthlyData
      }
    };
  }, [negociacoes, expirados, quitacoes, dashboardDateStart, dashboardDateEnd, dashboardStatusFilter]);

  // Validação usando hook consolidado
  const validateExpirado = (data: Expirado): boolean => {
    return (
      validateRequired(data.clienteNome, 'Nome do Cliente') &&
      validateRequired(data.curso, 'Curso') &&
      validateRequired(data.categoria, 'Categoria') &&
      validateDate(data.dataExpiracao, 'Data de Expiração') &&
      validateFutureDate(data.dataPrevisaPagamento, 'Data Prevista de Pagamento')
    );
  };

  const handleCreateNegociacao = useCallback(() => {
    // Obter data local no formato YYYY-MM-DD (não UTC)
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setSelectedNegociacao({
      clienteNome: '',
      cursoReferencia: '',
      dataNegociacao: hoje,
      previsaoPagamento: '',
      parcelasAtraso: '',
      dataVencimentoMaisAntiga: '',
      gatewayPagamento: '',
      observacoes: '',
      colaboradorResponsavel: '',
      origem: 'certificacao',
      status: 'aguardando_pagamento'
    });
    setIsCreateModalOpen(true);
  }, []);

  const handleDuplicateNegociacao = useCallback((negociacao: Negociacao) => {
    // Obter data local atual no formato YYYY-MM-DD (não UTC)
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    // Clonar todos os dados da negociação original, removendo o ID e atualizando a data
    const negociacaoDuplicada = {
      ...negociacao,
      id: undefined, // Remove ID para criar nova negociação
      dataNegociacao: hoje, // Atualiza para data atual
      observacoes: `${negociacao.observacoes} [DUPLICADO]`, // Marca como duplicado
      createdAt: undefined,
      updatedAt: undefined
    };
    
    setSelectedNegociacao(negociacaoDuplicada);
    setIsCreateModalOpen(true);
  }, []);

  const handleSaveNegociacao = useCallback(() => {
    if (!selectedNegociacao) return;

    // Validar campos obrigatórios
    const isValid = (
      validateRequired(selectedNegociacao.clienteNome, 'Nome do Cliente') &&
      validateDate(selectedNegociacao.dataNegociacao, 'Data da Negociação') &&
      validateFutureDate(selectedNegociacao.previsaoPagamento, 'Previsão de Pagamento') &&
      validateRequired(selectedNegociacao.colaboradorResponsavel, 'Colaborador Responsável')
    );

    if (!isValid) return;

    if (selectedNegociacao.id) {
      negociacoesCrud.update.mutate({ 
        id: selectedNegociacao.id, 
        data: selectedNegociacao 
      });
    } else {
      negociacoesCrud.create.mutate(selectedNegociacao);
    }
    
    setIsCreateModalOpen(false);
    setSelectedNegociacao(null);
  }, [selectedNegociacao, negociacoesCrud, validateRequired, validateDate, validateFutureDate]);

  const handleSaveExpirado = useCallback(() => {
    if (!selectedExpirado) return;

    if (!validateExpirado(selectedExpirado)) return;

    if (selectedExpirado.id) {
      expiradosCrud.update.mutate({ 
        id: selectedExpirado.id, 
        data: selectedExpirado 
      });
    } else {
      expiradosCrud.create.mutate(selectedExpirado);
    }
    
    setSelectedExpirado(null);
  }, [selectedExpirado, expiradosCrud, validateExpirado]);

  const handleDeleteNegociacao = useCallback((id: number | undefined) => {
    if (id) {
      setDeleteId(id);
    }
  }, []);

  const confirmDeleteNegociacao = useCallback(() => {
    if (deleteId) {
      negociacoesCrud.delete.mutate(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, negociacoesCrud]);

  const handleDeleteExpirado = useCallback((id: number) => {
    setDeleteExpiradoId(id);
  }, []);

  const confirmDeleteExpirado = useCallback(() => {
    if (deleteExpiradoId) {
      expiradosCrud.delete.mutate(deleteExpiradoId);
      setDeleteExpiradoId(null);
    }
  }, [deleteExpiradoId, expiradosCrud]);

  const handleCreateExpirado = () => {
    // Obter data local no formato YYYY-MM-DD (não UTC)
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setSelectedExpirado({
      clienteNome: '',
      curso: '',
      categoria: '',
      dataExpiracao: '',
      dataProposta: hoje,
      dataPrevisaPagamento: '',
      gatewayPagamento: '',
      statusProposta: 'pendente',
      observacoes: '',
      colaboradorResponsavel: ''
    });
  };

  const handleDuplicateExpirado = useCallback((expirado: Expirado) => {
    // Obter data local atual no formato YYYY-MM-DD (não UTC)
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    // Clonar todos os dados do expirado original, removendo o ID e atualizando datas
    const expiradoDuplicado = {
      ...expirado,
      id: undefined, // Remove ID para criar novo expirado
      dataProposta: hoje, // Atualiza para data atual
      observacoes: `${expirado.observacoes || ''} [DUPLICADO]`.trim(), // Marca como duplicado
      createdAt: undefined,
      updatedAt: undefined
    };
    
    setSelectedExpirado(expiradoDuplicado);
  }, []);

  // Funções para Quitações
  const handleDeleteQuitacao = useCallback((id: number) => {
    setDeleteQuitacaoId(id);
  }, []);

  const confirmDeleteQuitacao = useCallback(() => {
    if (deleteQuitacaoId) {
      quitacoesCrud.delete.mutate(deleteQuitacaoId);
      setDeleteQuitacaoId(null);
    }
  }, [deleteQuitacaoId, quitacoesCrud]);

  const handleCreateQuitacao = () => {
    // Obter data local no formato YYYY-MM-DD (não UTC)
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setSelectedQuitacao({
      clienteNome: '',
      clienteCpf: '',
      cursoReferencia: '',
      dataQuitacao: hoje,
      valorQuitado: '',
      dataUltimaParcelaQuitada: hoje,
      parcelasQuitadas: '1',
      gatewayPagamento: '',
      colaboradorResponsavel: '',
      status: 'quitado',
      observacoes: ''
    });
  };

  const handleDuplicateQuitacao = useCallback((quitacao: Quitacao) => {
    // Obter data local atual no formato YYYY-MM-DD (não UTC)
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    // Clonar todos os dados da quitação original, removendo o ID e atualizando a data
    const quitacaoDuplicada = {
      ...quitacao,
      id: undefined, // Remove ID para criar nova quitação
      dataQuitacao: hoje, // Atualiza para data atual
      dataUltimaParcelaQuitada: hoje, // Atualiza para data atual
      observacoes: `${quitacao.observacoes || ''} [DUPLICADO]`.trim(), // Marca como duplicado
      createdAt: undefined,
      updatedAt: undefined
    };
    
    setSelectedQuitacao(quitacaoDuplicada);
  }, []);

  const handleSaveQuitacao = useCallback(() => {
    if (!selectedQuitacao) return;

    // Validar campos obrigatórios
    const isValid = (
      validateRequired(selectedQuitacao.clienteNome, 'Nome do Cliente') &&
      validateRequired(selectedQuitacao.cursoReferencia, 'Curso de Referência') &&
      validateDate(selectedQuitacao.dataQuitacao, 'Data de Quitação') &&
      validateRequired(selectedQuitacao.colaboradorResponsavel, 'Colaborador Responsável')
    );

    if (!isValid) return;

    // Preparar dados para envio com conversões corretas
    const quitacaoData = {
      ...selectedQuitacao,
      parcelasQuitadas: parseInt(selectedQuitacao.parcelasQuitadas) || 1,
      valorQuitado: typeof selectedQuitacao.valorQuitado === 'string' 
        ? parseFloat(selectedQuitacao.valorQuitado.replace(',', '.')) 
        : selectedQuitacao.valorQuitado,
      // Garantir que campos opcionais vazios sejam null em vez de string vazia
      clienteCpf: selectedQuitacao.clienteCpf || null,
      dataUltimaParcelaQuitada: selectedQuitacao.dataUltimaParcelaQuitada || null,
      gatewayPagamento: selectedQuitacao.gatewayPagamento || null,
      observacoes: selectedQuitacao.observacoes || null
    };

    if (selectedQuitacao.id) {
      quitacoesCrud.update.mutate({ id: selectedQuitacao.id, data: quitacaoData });
    } else {
      quitacoesCrud.create.mutate(quitacaoData);
    }
    setSelectedQuitacao(null);
  }, [selectedQuitacao, quitacoesCrud, validateRequired, validateDate]);

  // Proteção de autenticação - movida para após todos os hooks
  if (loading) {
    return <LoadingCard message="Carregando página..." />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Proteção contra erros de renderização
  if (renderError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <div className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Negociações</h1>
            <p className="text-gray-600 mt-1">Gestão de negociações e cursos expirados</p>
          </div>
          <div className="flex-1 p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <div className="text-lg font-medium text-gray-900">Erro de Renderização</div>
                <div className="text-gray-600 mb-4">
                  Ocorreu um erro ao renderizar esta página: {renderError}
                </div>
                <Button
                  onClick={() => {
                    setRenderError(null);
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Recarregar Página
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 min-h-[44px] px-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Negociações</h1>
              <p className="text-gray-600">Gestão de negociações e cursos expirados</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="negociacoes" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Negociações
              </TabsTrigger>
              <TabsTrigger 
                value="expirados" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Expirados
              </TabsTrigger>
              <TabsTrigger 
                value="quitacoes" 
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Quitações
              </TabsTrigger>
            </TabsList>

            {/* Aba Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Filtros do Dashboard */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Filtros por Status e Período em uma linha */}
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Status Negociações */}
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Negociações</Label>
                        <Select value={dashboardStatusFilter.includes('aguardando_pagamento') || dashboardStatusFilter.includes('recebido') || dashboardStatusFilter.includes('acordo_quebrado') ? dashboardStatusFilter : 'all'} onValueChange={setDashboardStatusFilter}>
                          <SelectTrigger className="w-44 h-8">
                            <SelectValue placeholder="Status negociações" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="aguardando_pagamento">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                Aguardando Pagamento
                              </div>
                            </SelectItem>
                            <SelectItem value="recebido">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Recebido
                              </div>
                            </SelectItem>
                            <SelectItem value="acordo_quebrado">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Acordo Quebrado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Expirados */}
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Expirados</Label>
                        <Select value={['pendente', 'enviada', 'aceita', 'rejeitada'].includes(dashboardStatusFilter) ? dashboardStatusFilter : 'all'} onValueChange={setDashboardStatusFilter}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Status expirados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendente">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                Pendente
                              </div>
                            </SelectItem>
                            <SelectItem value="enviada">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Enviada
                              </div>
                            </SelectItem>
                            <SelectItem value="aceita">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Aceita
                              </div>
                            </SelectItem>
                            <SelectItem value="rejeitada">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Rejeitada
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Quitações */}
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Quitações</Label>
                        <Select value={dashboardStatusFilter === 'quitado' || dashboardStatusFilter === 'aguardando_pagamento_quit' ? dashboardStatusFilter : 'all'} onValueChange={setDashboardStatusFilter}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Status quitações" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="quitado">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                Quitado
                              </div>
                            </SelectItem>
                            <SelectItem value="aguardando_pagamento_quit">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                                Aguardando
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Separador */}
                      <div className="h-8 border-l border-gray-300"></div>

                      {/* Filtros de Data */}
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">
                          Período
                          {(dashboardDateStart || dashboardDateEnd) && (
                            <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Ativo</span>
                          )}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            placeholder="Data início"
                            value={dashboardDateStart}
                            onChange={(e) => setDashboardDateStart(e.target.value)}
                            className="w-32 h-8 text-xs"
                          />
                          <span className="text-gray-400 text-xs">até</span>
                          <Input
                            type="date"
                            placeholder="Data fim"
                            value={dashboardDateEnd}
                            onChange={(e) => setDashboardDateEnd(e.target.value)}
                            className="w-32 h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Botão Limpar */}
                      <div className="self-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDashboardDateStart('');
                            setDashboardDateEnd('');
                            setDashboardStatusFilter('all');
                          }}
                          className="h-8 text-xs"
                        >
                          Limpar Filtros
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {dashboardData ? (
                <div className="space-y-6">
                  {/* Cards de Métricas Gerais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setDashboardStatusFilter('all')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Negociações</p>
                            <p className="text-2xl font-bold text-blue-600">{dashboardData.totals.negociacoes}</p>
                            {dashboardStatusFilter === 'all' && (
                              <p className="text-xs text-blue-500 mt-1">Todos os dados</p>
                            )}
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setDashboardStatusFilter('all')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Expirados</p>
                            <p className="text-2xl font-bold text-red-600">{dashboardData.totals.expirados}</p>
                            <p className="text-xs text-gray-500 mt-1">Propostas expiradas</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setDashboardStatusFilter('all')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Quitações</p>
                            <p className="text-2xl font-bold text-green-600">{dashboardData.totals.quitacoes}</p>
                            <p className="text-xs text-gray-500 mt-1">Pagamentos finalizados</p>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cards de Status Específicos - Filtráveis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Status Específicos {dashboardStatusFilter !== 'all' && `- Filtro: ${dashboardStatusFilter.replace('_', ' ')}`}</h3>
                    
                    {/* Status de Negociações */}
                    <div>
                      <h4 className="text-md font-medium text-blue-700 mb-3">Negociações por Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card 
                          className={`hover:shadow-lg transition-shadow cursor-pointer ${dashboardStatusFilter === 'aguardando_pagamento' ? 'ring-2 ring-yellow-500' : ''}`} 
                          onClick={() => setDashboardStatusFilter('aguardando_pagamento')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Aguardando Pagamento</p>
                                <p className="text-xl font-bold text-yellow-600">{dashboardData.statusData.negociacoes.aguardando_pagamento || 0}</p>
                              </div>
                              <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className={`hover:shadow-lg transition-shadow cursor-pointer ${dashboardStatusFilter === 'recebido' ? 'ring-2 ring-green-500' : ''}`} 
                          onClick={() => setDashboardStatusFilter('recebido')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Recebidos</p>
                                <p className="text-xl font-bold text-green-600">{dashboardData.statusData.negociacoes.recebido || 0}</p>
                              </div>
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className={`hover:shadow-lg transition-shadow cursor-pointer ${dashboardStatusFilter === 'acordo_quebrado' ? 'ring-2 ring-red-500' : ''}`} 
                          onClick={() => setDashboardStatusFilter('acordo_quebrado')}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Acordo Quebrado</p>
                                <p className="text-xl font-bold text-red-600">{dashboardData.statusData.negociacoes.acordo_quebrado || 0}</p>
                              </div>
                              <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Status de Expirados */}
                    <div>
                      <h4 className="text-md font-medium text-red-700 mb-3">Expirados por Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Object.entries(dashboardData.statusData.expirados).map(([status, count]) => (
                          <Card 
                            key={status}
                            className={`hover:shadow-lg transition-shadow cursor-pointer ${dashboardStatusFilter === status ? 'ring-2 ring-orange-500' : ''}`} 
                            onClick={() => setDashboardStatusFilter(status)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                                  <p className="text-xl font-bold text-orange-600">{count}</p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${status === 'pendente' ? 'bg-orange-500' : status === 'enviada' ? 'bg-blue-500' : status === 'aceita' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Status de Quitações */}
                    <div>
                      <h4 className="text-md font-medium text-green-700 mb-3">Quitações por Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(dashboardData.statusData.quitacoes).map(([status, count]) => (
                          <Card 
                            key={status}
                            className={`hover:shadow-lg transition-shadow cursor-pointer ${(dashboardStatusFilter === 'quitado' && status === 'quitado') || (dashboardStatusFilter === 'aguardando_pagamento_quit' && status === 'aguardando_pagamento') ? 'ring-2 ring-green-500' : ''}`} 
                            onClick={() => setDashboardStatusFilter(status === 'aguardando_pagamento' ? 'aguardando_pagamento_quit' : status)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                                  <p className="text-xl font-bold text-green-600">{count}</p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${status === 'quitado' ? 'bg-green-600' : 'bg-yellow-600'}`}></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card de Valor Total */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Valor Total {dashboardStatusFilter !== 'all' && `(${dashboardStatusFilter.replace('_', ' ')})`}</p>
                          <p className="text-3xl font-bold text-purple-600">
                            R$ {(dashboardData.values.negociacoes + dashboardData.values.expirados + dashboardData.values.quitacoes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Período: {dashboardDateStart || 'Início'} até {dashboardDateEnd || 'Hoje'}
                          </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Distribuição por Tipo */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={dashboardData.chartData.statusChart}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {dashboardData.chartData.statusChart.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Gráfico de Valores por Tipo */}
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Valores por Tipo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dashboardData.chartData.valueChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                            <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                            <Bar dataKey="value" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Evolução Mensal */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Evolução Mensal (Últimos 6 Meses)</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={dashboardData.chartData.monthlyChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="negociacoes" stroke="#3B82F6" strokeWidth={2} name="Negociações" />
                          <Line type="monotone" dataKey="expirados" stroke="#EF4444" strokeWidth={2} name="Expirados" />
                          <Line type="monotone" dataKey="quitacoes" stroke="#10B981" strokeWidth={2} name="Quitações" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Resumo de Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-blue-600">Status das Negociações</h3>
                        <div className="space-y-2">
                          {Object.entries(dashboardData.statusData.negociacoes).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Status dos Expirados</h3>
                        <div className="space-y-2">
                          {Object.entries(dashboardData.statusData.expirados).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-green-600">Status das Quitações</h3>
                        <div className="space-y-2">
                          {Object.entries(dashboardData.statusData.quitacoes).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <LoadingCard message="Carregando dados do dashboard..." />
              )}
            </TabsContent>

            {/* Aba Negociações */}
            <TabsContent value="negociacoes" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="aguardando_pagamento">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Aguardando pagamento
                        </div>
                      </SelectItem>
                      <SelectItem value="recebido">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Recebido
                        </div>
                      </SelectItem>
                      <SelectItem value="acordo_quebrado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Acordo quebrado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Filtros de período */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Período:</Label>
                    <Input
                      type="date"
                      placeholder="Data início"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-40"
                    />
                    <span className="text-gray-400">até</span>
                    <Input
                      type="date"
                      placeholder="Data fim"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
                
                <Button onClick={handleCreateNegociacao} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Negociação
                </Button>
              </div>

              <div className="grid gap-4">
                {loadingNegociacoes ? (
                  <LoadingCard message="Carregando negociações..." />
                ) : negociacoes.length === 0 ? (
                  <EmptyStateCard 
                    icon={FileText}
                    title="Nenhuma negociação encontrada"
                    description="Crie uma nova negociação para começar"
                    action={{
                      label: "Nova Negociação",
                      onClick: handleCreateNegociacao
                    }}
                  />
                ) : (
                  negociacoes.map((negociacao: Negociacao, index: number) => (
                    <Card key={negociacao.id || `negociacao-${index}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{negociacao.clienteNome}</h3>
                              <StatusBadge status={negociacao.status} />
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Data Negociação:</span>
                                <div className="font-medium">
                                  {negociacao.dataNegociacao ? 
                                    (() => {
                                      try {
                                        return new Date(negociacao.dataNegociacao + 'T12:00:00').toLocaleDateString('pt-BR');
                                      } catch {
                                        return 'Data inválida';
                                      }
                                    })() 
                                    : 'Não informado'
                                  }
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Curso de Referência:</span>
                                <div className="font-medium">
                                  {negociacao.cursoReferencia || 'Não informado'}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Previsão Pagamento:</span>
                                <div className="font-medium">
                                  {negociacao.previsaoPagamento ? 
                                    (() => {
                                      try {
                                        return new Date(negociacao.previsaoPagamento + 'T12:00:00').toLocaleDateString('pt-BR');
                                      } catch {
                                        return 'Data inválida';
                                      }
                                    })() 
                                    : 'Não informado'
                                  }
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Valor Negociado:</span>
                                <div className="font-medium text-green-600">
                                  {negociacao.valorNegociado && !isNaN(Number(negociacao.valorNegociado)) 
                                    ? `R$ ${Number(negociacao.valorNegociado).toFixed(2)}` 
                                    : 'Não informado'
                                  }
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Parcelas em Atraso:</span>
                                <div className="font-medium text-red-600">{negociacao.parcelasAtraso}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Responsável:</span>
                                <div className="font-medium">{negociacao.colaboradorResponsavel}</div>
                              </div>
                            </div>
                            
                            {negociacao.observacoes && (
                              <div className="mt-3 text-sm text-gray-600">
                                <strong>Observações:</strong> {negociacao.observacoes}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateNegociacao(negociacao)}
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                              title="Duplicar negociação"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNegociacao(negociacao);
                                setIsCreateModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteNegociacao(negociacao.id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Aba Expirados */}
            <TabsContent value="expirados" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Input
                    placeholder="Buscar por nome ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pendente">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Pendente
                        </div>
                      </SelectItem>
                      <SelectItem value="enviada">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Enviada
                        </div>
                      </SelectItem>
                      <SelectItem value="aceita">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Aceita
                        </div>
                      </SelectItem>
                      <SelectItem value="rejeitada">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Rejeitada
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Filtros de período */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Período:</Label>
                    <Input
                      type="date"
                      placeholder="Data início"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-40"
                    />
                    <span className="text-gray-400">até</span>
                    <Input
                      type="date"
                      placeholder="Data fim"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
                
                <Button onClick={handleCreateExpirado} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Expirado
                </Button>
              </div>

              <div className="grid gap-4">
                {loadingExpirados ? (
                  <LoadingCard message="Carregando expirados..." />
                ) : expirados.length === 0 ? (
                  <EmptyStateCard 
                    icon={AlertTriangle}
                    title="Nenhum curso expirado encontrado"
                    description="Os cursos expirados aparecerão aqui"
                    action={{
                      label: "Novo Expirado",
                      onClick: handleCreateExpirado
                    }}
                  />
                ) : (
                  expirados.map((expirado: Expirado, index: number) => (
                    <Card key={expirado.id || `expirado-${index}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="mb-2">
                              <h3 className="text-lg font-semibold">{expirado.clienteNome}</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Curso:</span>
                                <div className="font-medium">{expirado.curso}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Categoria:</span>
                                <div className="font-medium">{expirado.categoria}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Data Expiração:</span>
                                <div className="font-medium text-red-600">
                                  {expirado.dataExpiracao ? 
                                    (() => {
                                      try {
                                        return new Date(expirado.dataExpiracao + 'T12:00:00').toLocaleDateString('pt-BR');
                                      } catch {
                                        return 'Data inválida';
                                      }
                                    })() 
                                    : 'Não informado'
                                  }
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Valor da Proposta:</span>
                                <div className="font-medium text-green-600">
                                  {expirado.valorProposta && !isNaN(Number(expirado.valorProposta)) 
                                    ? `R$ ${Number(expirado.valorProposta).toFixed(2).replace('.', ',')}` 
                                    : 'Não informado'
                                  }
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Gateway de Pagamento:</span>
                                <div className="font-medium text-purple-600">
                                  {expirado.gatewayPagamento || 'Não informado'}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Status da Proposta:</span>
                                <div className="font-medium">
                                  <StatusBadge status={expirado.statusProposta} />
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Responsável:</span>
                                <div className="font-medium">{expirado.colaboradorResponsavel}</div>
                              </div>
                            </div>
                            
                            {expirado.propostaReativacao && (
                              <div className="mt-3 text-sm text-gray-600">
                                <strong>Proposta:</strong> {expirado.propostaReativacao}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateExpirado(expirado)}
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                              title="Duplicar expirado"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedExpirado(expirado)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpirado(expirado.id!)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Aba Quitações */}
            <TabsContent value="quitacoes" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Input
                    placeholder="Buscar por nome, CPF ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="quitado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Quitado
                        </div>
                      </SelectItem>
                      <SelectItem value="aguardando_pagamento">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Aguardando Pagamento
                        </div>
                      </SelectItem>
                      <SelectItem value="vencido">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Vencido
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Data início"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-40"
                    />
                    <Input
                      type="date"
                      placeholder="Data fim"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateQuitacao}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Quitação
                </Button>
              </div>

              {loadingQuitacoes ? (
                <LoadingCard message="Carregando quitações..." />
              ) : quitacoes.length === 0 ? (
                <EmptyStateCard 
                  icon={CheckCircle2}
                  title="Nenhuma quitação encontrada"
                  description="Não há quitações cadastradas que correspondam aos filtros aplicados."
                />
              ) : (
                <div className="grid gap-4">
                  {quitacoes.map((quitacao: Quitacao) => (
                    <Card key={quitacao.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                          <div className="md:col-span-2">
                            <h3 className="font-semibold text-gray-900">{quitacao.clienteNome}</h3>
                            <p className="text-sm text-gray-600">CPF: {quitacao.clienteCpf}</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">{quitacao.cursoReferencia}</p>
                            <p className="text-sm text-gray-600">
                              Data: {new Date(quitacao.dataQuitacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">
                              R$ {typeof quitacao.valorQuitado === 'number' 
                                ? quitacao.valorQuitado.toFixed(2).replace('.', ',') 
                                : Number(quitacao.valorQuitado).toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-sm text-gray-600">
                              Parcelas: {quitacao.parcelasQuitadas}
                            </p>
                          </div>
                          
                          <div>
                            <StatusBadge status={quitacao.status} />
                            <p className="text-sm text-gray-600 mt-1">{quitacao.gatewayPagamento}</p>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedQuitacao(quitacao)}
                              className="min-h-[44px] px-3"
                              title="Editar quitação"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateQuitacao(quitacao)}
                              className="min-h-[44px] px-3"
                              title="Duplicar quitação"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => quitacao.id && handleDeleteQuitacao(quitacao.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] px-3"
                              title="Excluir quitação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Modal de Negociação */}
      <FormDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title={selectedNegociacao?.id ? 'Editar Negociação' : 'Nova Negociação'}
        description="Preencha os dados da negociação"
        onSave={handleSaveNegociacao}
        isLoading={negociacoesCrud.isLoading}
        maxWidth="2xl"
      >
          
          {selectedNegociacao && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                  <Input
                    id="clienteNome"
                    value={selectedNegociacao.clienteNome}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, clienteNome: e.target.value})}
                    placeholder="Nome completo"
                    className="form-input-responsive"
                  />
                </div>
                <div>
                  <Label htmlFor="clienteCpf">CPF</Label>
                  <Input
                    id="clienteCpf"
                    value={selectedNegociacao.clienteCpf || ''}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, clienteCpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cursoReferencia">Curso de Referência</Label>
                <Input
                  id="cursoReferencia"
                  value={selectedNegociacao.cursoReferencia || ''}
                  onChange={(e) => setSelectedNegociacao({...selectedNegociacao, cursoReferencia: e.target.value})}
                  placeholder="Digite o nome do curso referente a esta negociação"
                  className="form-input-responsive"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataNegociacao">Data da Negociação *</Label>
                  <Input
                    id="dataNegociacao"
                    type="date"
                    value={selectedNegociacao.dataNegociacao}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, dataNegociacao: e.target.value})}
                    className="cursor-pointer"
                    tabIndex={0}
                    placeholder="dd/mm/aaaa"
                    aria-label="Data da negociação"
                  />
                </div>
                <div>
                  <Label htmlFor="previsaoPagamento">Previsão de Pagamento *</Label>
                  <Input
                    id="previsaoPagamento"
                    type="date"
                    value={selectedNegociacao.previsaoPagamento}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, previsaoPagamento: e.target.value})}
                    className="cursor-pointer"
                    tabIndex={0}
                    placeholder="dd/mm/aaaa"
                    aria-label="Previsão de pagamento"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parcelasAtraso">Parcelas em Atraso</Label>
                  <Input
                    id="parcelasAtraso"
                    type="number"
                    min="0"
                    value={selectedNegociacao.parcelasAtraso}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, parcelasAtraso: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="valorNegociado">Valor Negociado (R$)</Label>
                  <Input
                    id="valorNegociado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedNegociacao.valorNegociado || ''}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, valorNegociado: parseFloat(e.target.value) || undefined})}
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataVencimentoMaisAntiga">Data Vencimento Mais Antiga</Label>
                  <Input
                    id="dataVencimentoMaisAntiga"
                    type="date"
                    value={selectedNegociacao.dataVencimentoMaisAntiga}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, dataVencimentoMaisAntiga: e.target.value})}
                    className="cursor-pointer"
                    tabIndex={0}
                    placeholder="dd/mm/aaaa"
                    aria-label="Data do vencimento mais antigo"
                  />
                </div>
                <div>
                  <Label htmlFor="gatewayPagamento">Gateway de Pagamento</Label>
                  <Select
                    value={selectedNegociacao.gatewayPagamento || ''}
                    onValueChange={(value) => setSelectedNegociacao({...selectedNegociacao, gatewayPagamento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asaas_uniao">Asaas União</SelectItem>
                      <SelectItem value="asaas_fadyc">Asaas Fadyc</SelectItem>
                      <SelectItem value="edunext_zayn">Edunext Zayn</SelectItem>
                      <SelectItem value="edunext_fadyc">Edunext Fadyc</SelectItem>
                      <SelectItem value="lytex_zayn">Lytex Zayn</SelectItem>
                      <SelectItem value="lytex_fadyc">Lytex Fadyc</SelectItem>
                      <SelectItem value="vivaedu">VivaEdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="colaboradorResponsavel">Colaborador Responsável *</Label>
                  <Select
                    value={selectedNegociacao.colaboradorResponsavel}
                    onValueChange={(value) => setSelectedNegociacao({...selectedNegociacao, colaboradorResponsavel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores
                        .filter((colab: any) => colab && colab.role && (colab.role === 'admin' || colab.role === 'agent'))
                        .map((colab: any, index: number) => (
                          <SelectItem key={colab.id || `colab-neg-${index}`} value={colab.username || ''}>
                            {colab.username || 'Usuário sem nome'} {colab.email ? `(${colab.email})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedNegociacao.status}
                    onValueChange={(value: 'aguardando_pagamento' | 'recebido' | 'acordo_quebrado') => setSelectedNegociacao({...selectedNegociacao, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando_pagamento">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Aguardando pagamento
                        </div>
                      </SelectItem>
                      <SelectItem value="recebido">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Recebido
                        </div>
                      </SelectItem>
                      <SelectItem value="acordo_quebrado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Acordo quebrado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <VoiceTranscription
                    onTranscript={(transcript) => {
                      const currentValue = selectedNegociacao.observacoes || "";
                      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
                      setSelectedNegociacao({...selectedNegociacao, observacoes: newValue});
                    }}
                    className="text-xs"
                  />
                </div>
                <Textarea
                  id="observacoes"
                  value={selectedNegociacao.observacoes}
                  onChange={(e) => setSelectedNegociacao({...selectedNegociacao, observacoes: e.target.value})}
                  placeholder="Detalhes da negociação, acordos, etc."
                  rows={3}
                />
              </div>
            </div>
          )}
          
      </FormDialog>

      {/* Modal de Expirado */}
      <FormDialog
        open={!!selectedExpirado}
        onOpenChange={(open) => !open && setSelectedExpirado(null)}
        title={selectedExpirado?.id ? 'Editar Expirado' : 'Novo Expirado'}
        description="Dados do curso expirado e proposta de reativação"
        onSave={handleSaveExpirado}
        isLoading={expiradosCrud.isLoading}
        maxWidth="2xl"
      >
          
          {selectedExpirado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                  <Input
                    id="clienteNome"
                    value={selectedExpirado.clienteNome}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, clienteNome: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="clienteCpf">CPF</Label>
                  <Input
                    id="clienteCpf"
                    value={selectedExpirado.clienteCpf || ''}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, clienteCpf: e.target.value})}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="curso">Curso *</Label>
                  <Input
                    id="curso"
                    value={selectedExpirado.curso}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, curso: e.target.value})}
                    placeholder="Nome do curso"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={selectedExpirado.categoria}
                    onValueChange={(value) => setSelectedExpirado({...selectedExpirado, categoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                      <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                      <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                      <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                      <SelectItem value="graduacao">Graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataExpiracao">Data de Expiração *</Label>
                  <Input
                    id="dataExpiracao"
                    type="date"
                    value={selectedExpirado.dataExpiracao}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, dataExpiracao: e.target.value})}
                    className="cursor-pointer"
                    tabIndex={0}
                    placeholder="dd/mm/aaaa"
                    aria-label="Data de expiração do curso"
                  />
                </div>
                <div>
                  <Label htmlFor="dataPrevisaPagamento">Data Prevista de Pagamento *</Label>
                  <Input
                    id="dataPrevisaPagamento"
                    type="date"
                    value={selectedExpirado.dataPrevisaPagamento || ''}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, dataPrevisaPagamento: e.target.value})}
                    className="cursor-pointer"
                    tabIndex={0}
                    placeholder="dd/mm/aaaa"
                    aria-label="Data prevista para pagamento"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorProposta">Valor da Proposta (R$)</Label>
                  <Input
                    id="valorProposta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedExpirado.valorProposta || ''}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, valorProposta: parseFloat(e.target.value) || undefined})}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="gatewayPagamento">Gateway de Pagamento</Label>
                  <Select
                    value={selectedExpirado.gatewayPagamento || ''}
                    onValueChange={(value) => setSelectedExpirado({...selectedExpirado, gatewayPagamento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asaas_uniao">Asaas União</SelectItem>
                      <SelectItem value="asaas_fadyc">Asaas Fadyc</SelectItem>
                      <SelectItem value="edunext_zayn">Edunext Zayn</SelectItem>
                      <SelectItem value="edunext_fadyc">Edunext Fadyc</SelectItem>
                      <SelectItem value="lytex_zayn">Lytex Zayn</SelectItem>
                      <SelectItem value="lytex_fadyc">Lytex Fadyc</SelectItem>
                      <SelectItem value="vivaedu">VivaEdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="colaboradorResponsavel">Colaborador Responsável *</Label>
                  <Select
                    value={selectedExpirado.colaboradorResponsavel}
                    onValueChange={(value) => setSelectedExpirado({...selectedExpirado, colaboradorResponsavel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores
                        .filter((colab: any) => colab && colab.role && (colab.role === 'admin' || colab.role === 'agent'))
                        .map((colab: any, index: number) => (
                          <SelectItem key={colab.id || `colab-exp-${index}`} value={colab.username || ''}>
                            {colab.username || 'Usuário sem nome'} {colab.email ? `(${colab.email})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusProposta">Status da Proposta</Label>
                  <Select
                    value={selectedExpirado.statusProposta}
                    onValueChange={(value: 'pendente' | 'enviada' | 'aceita' | 'rejeitada' | 'pago' | 'aguardando_pagamento' | 'vencida') => setSelectedExpirado({...selectedExpirado, statusProposta: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Pendente
                        </div>
                      </SelectItem>
                      <SelectItem value="enviada">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Enviada
                        </div>
                      </SelectItem>
                      <SelectItem value="aceita">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Aceita
                        </div>
                      </SelectItem>
                      <SelectItem value="rejeitada">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Rejeitada
                        </div>
                      </SelectItem>
                      <SelectItem value="pago">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Pago
                        </div>
                      </SelectItem>
                      <SelectItem value="aguardando_pagamento">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          Aguardando Pagamento
                        </div>
                      </SelectItem>
                      <SelectItem value="vencida">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          Vencida
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Legenda dos status */}
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>Pendente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>Enviada</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Aceita</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Rejeitada</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Pago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>Aguardando Pagamento</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span>Vencida</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <VoiceTranscription
                    onTranscript={(transcript) => {
                      const currentValue = selectedExpirado.observacoes || "";
                      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
                      setSelectedExpirado({...selectedExpirado, observacoes: newValue});
                    }}
                    className="text-xs"
                  />
                </div>
                <Textarea
                  id="observacoes"
                  value={selectedExpirado.observacoes}
                  onChange={(e) => setSelectedExpirado({...selectedExpirado, observacoes: e.target.value})}
                  placeholder="Informações adicionais sobre o cliente ou situação"
                  rows={2}
                />
              </div>
            </div>
          )}
          
      </FormDialog>

      {/* Diálogos de confirmação consolidados */}
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDeleteNegociacao}
        isLoading={negociacoesCrud.delete.isPending}
        title="Confirmar Exclusão"
        description="Tem certeza de que deseja excluir esta negociação? Esta ação não pode ser desfeita."
      />

      <DeleteConfirmDialog
        open={deleteExpiradoId !== null}
        onOpenChange={(open) => !open && setDeleteExpiradoId(null)}
        onConfirm={confirmDeleteExpirado}
        isLoading={expiradosCrud.delete.isPending}
        title="Confirmar Exclusão"
        description="Tem certeza de que deseja excluir este expirado? Esta ação não pode ser desfeita."
      />

      <DeleteConfirmDialog
        open={deleteQuitacaoId !== null}
        onOpenChange={(open) => !open && setDeleteQuitacaoId(null)}
        onConfirm={confirmDeleteQuitacao}
        isLoading={quitacoesCrud.delete.isPending}
        title="Confirmar Exclusão"
        description="Tem certeza de que deseja excluir esta quitação? Esta ação não pode ser desfeita."
      />

      {/* Modal para Quitações */}
      <FormDialog
        open={selectedQuitacao !== null}
        onOpenChange={(open) => !open && setSelectedQuitacao(null)}
        title={selectedQuitacao?.id ? "Editar Quitação" : "Nova Quitação"}
        description="Preencha os dados da quitação"
        onSave={handleSaveQuitacao}
        isLoading={quitacoesCrud.create.isPending || quitacoesCrud.update.isPending}
        maxWidth="2xl"
      >
        {selectedQuitacao && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                <Input
                  id="clienteNome"
                  value={selectedQuitacao.clienteNome}
                  onChange={(e) => setSelectedQuitacao({...selectedQuitacao, clienteNome: e.target.value})}
                  placeholder="Nome completo"
                  className="form-input-responsive"
                />
              </div>
              <div>
                <Label htmlFor="clienteCpf">CPF do Cliente *</Label>
                <Input
                  id="clienteCpf"
                  value={selectedQuitacao.clienteCpf}
                  onChange={(e) => setSelectedQuitacao({...selectedQuitacao, clienteCpf: e.target.value})}
                  placeholder="000.000.000-00"
                  className="form-input-responsive"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cursoReferencia">Curso de Referência *</Label>
              <Input
                id="cursoReferencia"
                value={selectedQuitacao.cursoReferencia}
                onChange={(e) => setSelectedQuitacao({...selectedQuitacao, cursoReferencia: e.target.value})}
                placeholder="Nome do curso"
                className="form-input-responsive"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataQuitacao">Data de Quitação *</Label>
                <Input
                  id="dataQuitacao"
                  type="date"
                  value={selectedQuitacao.dataQuitacao}
                  onChange={(e) => setSelectedQuitacao({...selectedQuitacao, dataQuitacao: e.target.value})}
                  className="cursor-pointer form-input-responsive"
                />
              </div>
              <div>
                <Label htmlFor="dataUltimaParcelaQuitada">Data da Última Parcela Quitada *</Label>
                <Input
                  id="dataUltimaParcelaQuitada"
                  type="date"
                  value={selectedQuitacao.dataUltimaParcelaQuitada}
                  onChange={(e) => setSelectedQuitacao({...selectedQuitacao, dataUltimaParcelaQuitada: e.target.value})}
                  className="cursor-pointer form-input-responsive"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valorQuitado">Valor Quitado (R$) *</Label>
                <Input
                  id="valorQuitado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={selectedQuitacao.valorQuitado}
                  onChange={(e) => setSelectedQuitacao({...selectedQuitacao, valorQuitado: e.target.value})}
                  placeholder="0,00"
                  className="form-input-responsive"
                />
              </div>
              <div>
                <Label htmlFor="parcelasQuitadas">Número de Parcelas Quitadas *</Label>
                <Input
                  id="parcelasQuitadas"
                  type="number"
                  min="1"
                  value={selectedQuitacao.parcelasQuitadas}
                  onChange={(e) => setSelectedQuitacao({...selectedQuitacao, parcelasQuitadas: e.target.value})}
                  placeholder="12"
                  className="form-input-responsive"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gatewayPagamento">Gateway de Pagamento *</Label>
                <Select
                  value={selectedQuitacao.gatewayPagamento}
                  onValueChange={(value) => setSelectedQuitacao({...selectedQuitacao, gatewayPagamento: value})}
                >
                  <SelectTrigger className="form-input-responsive">
                    <SelectValue placeholder="Selecionar gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asaas_uniao">Asaas União</SelectItem>
                    <SelectItem value="asaas_fadyc">Asaas Fadyc</SelectItem>
                    <SelectItem value="edunext_zayn">Edunext Zayn</SelectItem>
                    <SelectItem value="edunext_fadyc">Edunext Fadyc</SelectItem>
                    <SelectItem value="lytex_zayn">Lytex Zayn</SelectItem>
                    <SelectItem value="lytex_fadyc">Lytex Fadyc</SelectItem>
                    <SelectItem value="vivaedu">VivaEdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status da Quitação *</Label>
                <Select
                  value={selectedQuitacao.status}
                  onValueChange={(value: 'quitado' | 'aguardando_pagamento' | 'vencido') => setSelectedQuitacao({...selectedQuitacao, status: value})}
                >
                  <SelectTrigger className="form-input-responsive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quitado">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Quitado
                      </div>
                    </SelectItem>
                    <SelectItem value="aguardando_pagamento">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Aguardando Pagamento
                      </div>
                    </SelectItem>
                    <SelectItem value="vencido">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Vencido
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="colaboradorResponsavel">Colaborador Responsável *</Label>
              <Select
                value={selectedQuitacao.colaboradorResponsavel}
                onValueChange={(value) => setSelectedQuitacao({...selectedQuitacao, colaboradorResponsavel: value})}
              >
                <SelectTrigger className="form-input-responsive">
                  <SelectValue placeholder="Selecionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores
                    .filter((colab: any) => colab && colab.role && (colab.role === 'admin' || colab.role === 'agent'))
                    .map((colab: any, index: number) => (
                      <SelectItem key={colab.id || `colab-quit-${index}`} value={colab.username || ''}>
                        {colab.username || 'Usuário sem nome'} {colab.email ? `(${colab.email})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="observacoes">Observações</Label>
                <VoiceTranscription
                  onTranscript={(transcript) => {
                    const currentValue = selectedQuitacao.observacoes || "";
                    const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
                    setSelectedQuitacao({...selectedQuitacao, observacoes: newValue});
                  }}
                  className="text-xs"
                />
              </div>
              <Textarea
                id="observacoes"
                value={selectedQuitacao.observacoes || ''}
                onChange={(e) => setSelectedQuitacao({...selectedQuitacao, observacoes: e.target.value})}
                placeholder="Informações adicionais sobre a quitação"
                rows={3}
                className="form-input-responsive"
              />
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
};

export default Negociacoes;