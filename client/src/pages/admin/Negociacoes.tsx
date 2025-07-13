import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, FileText, Plus, Edit, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
  parcelasAtraso: number;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar colaboradores (usuários admin e agentes)
  const { data: colaboradores = [], isLoading: loadingColaboradores } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });

  // Buscar negociações
  const { data: negociacoes = [], isLoading: loadingNegociacoes } = useQuery({
    queryKey: ['/api/negociacoes', { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      return apiRequest(`/api/negociacoes?${params}`);
    }
  });

  // Buscar expirados
  const { data: expirados = [], isLoading: loadingExpirados } = useQuery({
    queryKey: ['/api/negociacoes-expirados', { search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      return apiRequest(`/api/negociacoes-expirados?${params}`);
    }
  });

  // Mutation para criar/atualizar negociação
  const negociacaoMutation = useMutation({
    mutationFn: async (data: Negociacao) => {
      if (isSubmitting) {
        throw new Error('Submissão já em andamento');
      }
      
      setIsSubmitting(true);
      
      if (data.id) {
        return apiRequest(`/api/negociacoes/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/negociacoes', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/negociacoes'] });
      setIsCreateModalOpen(false);
      setSelectedNegociacao(null);
      setIsSubmitting(false);
      toast({ title: "Sucesso", description: "Negociação salva com sucesso!" });
    },
    onError: () => {
      setIsSubmitting(false);
      toast({ title: "Erro", description: "Erro ao salvar negociação" });
    }
  });

  // Mutation para criar/atualizar expirado
  const expiradoMutation = useMutation({
    mutationFn: async (data: Expirado) => {
      if (data.id) {
        return apiRequest(`/api/negociacoes-expirados/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/negociacoes-expirados', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/negociacoes-expirados'] });
      setSelectedExpirado(null);
      toast({ title: "Sucesso", description: "Expirado salvo com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao salvar expirado" });
    }
  });

  const handleCreateNegociacao = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setSelectedNegociacao({
      clienteNome: '',
      dataNegociacao: hoje,
      previsaoPagamento: '',
      parcelasAtraso: 0,
      dataVencimentoMaisAntiga: '',
      gatewayPagamento: '',
      observacoes: '',
      colaboradorResponsavel: '',
      origem: 'certificacao',
      status: 'aguardando_pagamento'
    });
    setIsSubmitting(false);
    setIsCreateModalOpen(true);
  }, []);

  const handleSaveNegociacao = useCallback(() => {
    if (selectedNegociacao && !isSubmitting && !negociacaoMutation.isPending) {
      negociacaoMutation.mutate(selectedNegociacao);
    }
  }, [selectedNegociacao, isSubmitting, negociacaoMutation]);

  const deleteNegociacaoMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/negociacoes/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/negociacoes'] });
      setDeleteId(null);
      toast({
        title: "Sucesso",
        description: "Negociação excluída com sucesso!",
      });
    },
    onError: () => {
      setDeleteId(null);
      toast({
        title: "Erro",
        description: "Erro ao excluir negociação",
        variant: "destructive",
      });
    },
  });

  const handleDeleteNegociacao = useCallback((id: number) => {
    setDeleteId(id);
  }, []);

  const confirmDeleteNegociacao = useCallback(() => {
    if (deleteId) {
      deleteNegociacaoMutation.mutate(deleteId);
    }
  }, [deleteId, deleteNegociacaoMutation]);

  // Limpar estado ao fechar modal
  useEffect(() => {
    if (!isCreateModalOpen) {
      setIsSubmitting(false);
    }
  }, [isCreateModalOpen]);

  const handleCreateExpirado = () => {
    setSelectedExpirado({
      clienteNome: '',
      curso: '',
      categoria: '',
      dataExpiracao: '',
      statusProposta: 'pendente',
      observacoes: '',
      colaboradorResponsavel: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'aguardando_pagamento': 'bg-yellow-100 text-yellow-800',
      'recebido': 'bg-green-100 text-green-800', 
      'acordo_quebrado': 'bg-red-100 text-red-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      enviada: 'bg-purple-100 text-purple-800',
      aceita: 'bg-green-100 text-green-800',
      rejeitada: 'bg-red-100 text-red-800'
    };
    
    const dotColors = {
      'aguardando_pagamento': 'bg-yellow-500',
      'recebido': 'bg-green-500',
      'acordo_quebrado': 'bg-red-500',
      pendente: 'bg-yellow-500',
      enviada: 'bg-purple-500',
      aceita: 'bg-green-500',
      rejeitada: 'bg-red-500'
    };
    
    const labels = {
      'aguardando_pagamento': 'Aguardando pagamento',
      'recebido': 'Recebido',
      'acordo_quebrado': 'Acordo quebrado',
      pendente: 'Pendente',
      enviada: 'Enviada',
      aceita: 'Aceita',
      rejeitada: 'Rejeitada'
    };
    
    const label = labels[status as keyof typeof labels] || status;
    const dotColor = dotColors[status as keyof typeof dotColors] || 'bg-gray-500';
    
    return (
      <Badge className={`${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
        <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
        {label}
      </Badge>
    );
  };

  // Proteção de autenticação - movida para após todos os hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
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
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
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
                </div>
                <Button onClick={handleCreateNegociacao}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Negociação
                </Button>
              </div>

              <div className="grid gap-4">
                {loadingNegociacoes ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">Carregando negociações...</div>
                    </CardContent>
                  </Card>
                ) : negociacoes.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-lg font-medium text-gray-900">Nenhuma negociação encontrada</div>
                      <div className="text-gray-600">Crie uma nova negociação para começar</div>
                    </CardContent>
                  </Card>
                ) : (
                  negociacoes.map((negociacao: Negociacao) => (
                    <Card key={negociacao.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{negociacao.clienteNome}</h3>
                              {getStatusBadge(negociacao.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Data Negociação:</span>
                                <div className="font-medium">{new Date(negociacao.dataNegociacao + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Previsão Pagamento:</span>
                                <div className="font-medium">{new Date(negociacao.previsaoPagamento + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Valor Negociado:</span>
                                <div className="font-medium text-green-600">
                                  {negociacao.valorNegociado ? `R$ ${Number(negociacao.valorNegociado).toFixed(2)}` : 'Não informado'}
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
              <div className="flex justify-between items-center">
                <Input
                  placeholder="Buscar por nome ou curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button onClick={handleCreateExpirado}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Expirado
                </Button>
              </div>

              <div className="grid gap-4">
                {loadingExpirados ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">Carregando expirados...</div>
                    </CardContent>
                  </Card>
                ) : expirados.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-lg font-medium text-gray-900">Nenhum curso expirado encontrado</div>
                      <div className="text-gray-600">Os cursos expirados aparecerão aqui</div>
                    </CardContent>
                  </Card>
                ) : (
                  expirados.map((expirado: Expirado) => (
                    <Card key={expirado.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{expirado.clienteNome}</h3>
                              {getStatusBadge(expirado.statusProposta)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                <div className="font-medium text-red-600">{new Date(expirado.dataExpiracao).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Responsável:</span>
                                <div className="font-medium">{expirado.colaboradorResponsavel}</div>
                              </div>
                            </div>
                            
                            {expirado.propostaReativacao && (
                              <div className="mt-3 text-sm text-gray-600">
                                <strong>Proposta:</strong> {expirado.propostaReativacao}
                                {expirado.valorProposta && (
                                  <span className="ml-2 font-semibold">R$ {Number(expirado.valorProposta).toFixed(2)}</span>
                                )}
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
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedNegociacao?.id ? 'Editar Negociação' : 'Nova Negociação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da negociação
            </DialogDescription>
          </DialogHeader>
          
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
                  />
                </div>
                <div>
                  <Label htmlFor="previsaoPagamento">Previsão de Pagamento *</Label>
                  <Input
                    id="previsaoPagamento"
                    type="date"
                    value={selectedNegociacao.previsaoPagamento}
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, previsaoPagamento: e.target.value})}
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
                    onChange={(e) => setSelectedNegociacao({...selectedNegociacao, parcelasAtraso: parseInt(e.target.value) || 0})}
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
                      {colaboradores.filter((colab: any) => colab.role === 'admin' || colab.role === 'agent').map((colab: any) => (
                        <SelectItem key={colab.id} value={colab.username}>
                          {colab.username} ({colab.email})
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              setSelectedNegociacao(null);
              setIsSubmitting(false);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNegociacao}
              disabled={!selectedNegociacao?.clienteNome || !selectedNegociacao?.dataNegociacao || !selectedNegociacao?.previsaoPagamento || !selectedNegociacao?.colaboradorResponsavel || isSubmitting || negociacaoMutation.isPending}
            >
              {isSubmitting || negociacaoMutation.isPending ? "Salvando..." : "Salvar Negociação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Expirado */}
      <Dialog open={!!selectedExpirado} onOpenChange={(open) => !open && setSelectedExpirado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedExpirado?.id ? 'Editar Expirado' : 'Novo Expirado'}
            </DialogTitle>
            <DialogDescription>
              Dados do curso expirado e proposta de reativação
            </DialogDescription>
          </DialogHeader>
          
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
                  />
                </div>
                <div>
                  <Label htmlFor="dataProposta">Data da Proposta</Label>
                  <Input
                    id="dataProposta"
                    type="date"
                    value={selectedExpirado.dataProposta || ''}
                    onChange={(e) => setSelectedExpirado({...selectedExpirado, dataProposta: e.target.value})}
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
                      {colaboradores.filter((colab: any) => colab.role === 'admin' || colab.role === 'agent').map((colab: any) => (
                        <SelectItem key={colab.id} value={colab.username}>
                          {colab.username} ({colab.email})
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExpirado(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedExpirado && expiradoMutation.mutate(selectedExpirado)}
              disabled={!selectedExpirado?.clienteNome || !selectedExpirado?.curso || !selectedExpirado?.categoria || !selectedExpirado?.dataExpiracao || !selectedExpirado?.colaboradorResponsavel}
            >
              Salvar Expirado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta negociação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNegociacao}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteNegociacaoMutation.isPending}
            >
              {deleteNegociacaoMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Negociacoes;