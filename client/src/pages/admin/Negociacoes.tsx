import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
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

interface Negociacao {
  id?: number;
  clienteNome: string;
  clienteEmail?: string;
  clienteCpf?: string;
  clienteTelefone?: string;
  curso?: string;
  categoria?: string;
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
  statusProposta: 'pendente' | 'enviada' | 'aceita' | 'rejeitada';
  observacoes: string;
  colaboradorResponsavel: string;
  createdAt?: string;
  updatedAt?: string;
}

const Negociacoes: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('negociacoes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
  const [selectedExpirado, setSelectedExpirado] = useState<Expirado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteExpiradoId, setDeleteExpiradoId] = useState<number | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

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

  // Reset error state quando dados mudam
  useEffect(() => {
    setRenderError(null);
  }, [negociacoes, expirados]);

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
      statusProposta: 'pendente',
      observacoes: '',
      colaboradorResponsavel: ''
    });
  };

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
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="negociacoes" 
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Negociações
              </TabsTrigger>
              <TabsTrigger 
                value="expirados" 
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Expirados
              </TabsTrigger>
            </TabsList>

            {/* Aba Negociações */}
            <TabsContent value="negociacoes" className="space-y-6">
              <div className="flex flex-col gap-4">
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
                
                <div className="flex justify-end">
                  <Button onClick={handleCreateNegociacao}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Negociação
                  </Button>
                </div>
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
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
              <div className="flex flex-col gap-4">
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
                
                <div className="flex justify-end">
                  <Button onClick={handleCreateExpirado}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Expirado
                  </Button>
                </div>
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
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{expirado.clienteNome}</h3>
                              <StatusBadge status={expirado.statusProposta} />
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                    min={new Date().toISOString().split('T')[0]}
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
                <Label htmlFor="observacoes">Observações</Label>
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
                    min={new Date().toISOString().split('T')[0]}
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
                  {/* Campo vazio para manter layout em 2 colunas */}
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
                    onValueChange={(value: 'pendente' | 'enviada' | 'aceita' | 'rejeitada') => setSelectedExpirado({...selectedExpirado, statusProposta: value})}
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
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="propostaReativacao">Proposta de Reativação</Label>
                <Textarea
                  id="propostaReativacao"
                  value={selectedExpirado.propostaReativacao || ''}
                  onChange={(e) => setSelectedExpirado({...selectedExpirado, propostaReativacao: e.target.value})}
                  placeholder="Descreva a proposta de reativação oferecida ao cliente"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
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
    </div>
  );
};

export default Negociacoes;