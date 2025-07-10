import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Plus, Eye, Copy, FileText, Link as LinkIcon, X, AlertTriangle, RefreshCw, Trash2, Database, Calendar, TrendingUp, TrendingDown, Users, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from 'react-router-dom';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AsaasPayment {
  id: string;
  customer: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCpfCnpj?: string;
  value: number;
  description: string;
  billingType: string;
  dueDate: string;
  status: string;
}

export default function Cobrancas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<AsaasPayment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // Período para métricas
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar cobranças do banco de dados (carrega automaticamente)
  const { data: paymentsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/asaas/payments-db'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/asaas/payments-db');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true // Carrega automaticamente as cobranças do banco de dados
  });

  // Buscar métricas por período
  const { data: metricsData } = useQuery({
    queryKey: ['/api/admin/asaas/metrics', selectedPeriod],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/asaas/metrics?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true
  });

  // Mutation para limpar cache
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/asaas/payments/clear-cache', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache do React Query também
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    }
  });

  // Mutation para sincronização persistente
  const syncPersistentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/asaas/sync-persistent', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: data.message || "Dados salvos no banco com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para buscar detalhes do pagamento
  const paymentDetailsMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest(`/api/admin/asaas/payments/${paymentId}/details`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, paymentId) => {
      setSelectedPayment(data);
      setIsDetailsModalOpen(true);
      toast({
        title: "Detalhes carregados",
        description: "Informações do pagamento foram atualizadas com sucesso."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao carregar detalhes",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para reenviar cobrança
  const resendPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest(`/api/admin/asaas/payments/${paymentId}/resend`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cobrança reenviada",
        description: "A cobrança foi reenviada com sucesso para o cliente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar cobrança",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para cancelar pagamento
  const cancelPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest(`/api/admin/asaas/payments/${paymentId}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar pagamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para estornar pagamento
  const refundPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest(`/api/admin/asaas/payments/${paymentId}/refund`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento estornado",
        description: "O estorno foi processado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao estornar pagamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleClearCache = () => {
    clearCacheMutation.mutate();
  };

  const handleSyncPersistent = () => {
    syncPersistentMutation.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para obter nome do período em português
  const getPeriodName = (period: string) => {
    switch (period) {
      case 'day': return 'Hoje';
      case 'week': return 'Esta semana';
      case 'month': return 'Este mês';
      case '3months': return 'Últimos 3 meses';
      default: return 'Este mês';
    }
  };

  // Usar apenas dados reais da API do Asaas
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const filteredPayments = payments.filter((payment: AsaasPayment) => {
    const matchesSearch = searchTerm === '' || 
      payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.includes(searchTerm);
    return matchesSearch;
  });

  // Calcular estatísticas
  const stats = {
    total: payments.length,
    totalValue: payments.reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
    pendingValue: payments.filter((p: AsaasPayment) => p.status === 'PENDING').reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
    overdueValue: payments.filter((p: AsaasPayment) => p.status === 'OVERDUE').reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header idêntico à imagem */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/integracao-asaas">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cobranças</h1>
          <p className="text-gray-600">Gerencie todas as cobranças de seus alunos.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            className="text-orange-600 border-orange-600"
            onClick={handleClearCache}
            disabled={clearCacheMutation.isPending}
          >
            {clearCacheMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Limpar Cache
          </Button>
          <Button 
            variant="outline" 
            className="text-green-600 border-green-600"
            onClick={handleSyncPersistent}
            disabled={syncPersistentMutation.isPending}
          >
            {syncPersistentMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Sincronizar Persistente
          </Button>
          <Button 
            variant="outline" 
            className="text-blue-600 border-blue-600"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar com Asaas
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova cobrança
          </Button>
        </div>
      </div>

      {/* Erro de API - quando há problemas com Asaas */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message?.includes('429') || error.message?.includes('cota') ? 
              'Cota de requisições da API Asaas esgotada. Aguarde alguns minutos e tente novamente.' :
              `Erro ao conectar com a API do Asaas. Verifique suas credenciais e tente novamente. ${error.message ? `(${error.message})` : ''}`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso sobre uso de dados reais */}
      {!error && !isLoading && Array.isArray(paymentsData) && paymentsData.length === 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Clique em "Sincronizar com Asaas" para carregar as cobranças reais da sua conta. 
            O sistema usa exclusivamente dados reais da API do Asaas.
          </AlertDescription>
        </Alert>
      )}

      {/* Seletor de período e cards dinâmicos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard - Métricas por Período</h2>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de métricas dinâmicas */}
        <div className="grid grid-cols-5 gap-4">
          {/* Total */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Total de Cobranças
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">
                {metricsData?.metrics?.total?.count || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(metricsData?.metrics?.total?.value || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Recebidas */}
          <Card className="border border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Recebidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {metricsData?.metrics?.received?.count || 0}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {formatCurrency(metricsData?.metrics?.received?.value || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {metricsData?.metrics?.received?.customers || 0} clientes
              </div>
            </CardContent>
          </Card>

          {/* Pendentes */}
          <Card className="border border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-500" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">
                {metricsData?.metrics?.pending?.count || 0}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {formatCurrency(metricsData?.metrics?.pending?.value || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {metricsData?.metrics?.pending?.customers || 0} clientes
              </div>
            </CardContent>
          </Card>

          {/* Vencidas */}
          <Card className="border border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700 font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">
                {metricsData?.metrics?.overdue?.count || 0}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {formatCurrency(metricsData?.metrics?.overdue?.value || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {metricsData?.metrics?.overdue?.customers || 0} clientes
              </div>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card className="border border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Clientes Únicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {metricsData?.metrics?.total?.customers || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getPeriodName(selectedPeriod)}
              </div>
            </CardContent>
          </Card>
        </div>

        {!metricsData && (
          <div className="text-center py-4 text-gray-500">
            Carregando métricas...
          </div>
        )}
      </div>

      {/* Tabela principal - idêntica à imagem */}
      <div className="bg-white rounded-lg border">
        {/* Header da tabela */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por aluno ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">1 Ações em lote ▼</span>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar cobrança
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Carregando cobranças...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhuma cobrança encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment: AsaasPayment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{payment.id.slice(-3)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {(payment.customerName || payment.customer)?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {payment.customerName || payment.customer || 'Cliente'}
                        </span>
                        {payment.customerEmail && (
                          <span className="text-xs text-gray-500">
                            {payment.customerEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(payment.value)}</TableCell>
                  <TableCell>{formatDate(payment.dueDate)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                      payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status === 'PENDING' ? 'Pendente' :
                       payment.status === 'RECEIVED' ? 'Recebido' :
                       payment.status === 'OVERDUE' ? 'Vencido' : payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {payment.billingType === 'PIX' ? 'Pix' : 
                       payment.billingType === 'BOLETO' ? 'Boleto' : 
                       payment.billingType === 'CREDIT_CARD' ? 'Cartão' : payment.billingType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-blue-600"
                        onClick={() => paymentDetailsMutation.mutate(payment.id)}
                        disabled={paymentDetailsMutation.isPending}
                        title="Visualizar detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-green-600"
                        onClick={() => resendPaymentMutation.mutate(payment.id)}
                        disabled={resendPaymentMutation.isPending}
                        title="Reenviar cobrança"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" title="Copiar link">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" title="Ver documento">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => cancelPaymentMutation.mutate(payment.id)}
                        disabled={cancelPaymentMutation.isPending}
                        title="Cancelar pagamento"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {payment.status === 'RECEIVED' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-orange-600"
                          onClick={() => refundPaymentMutation.mutate(payment.id)}
                          disabled={refundPaymentMutation.isPending}
                          title="Estornar pagamento"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer da tabela */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredPayments.length} cobranças no valor total de{' '}
              <span className="font-semibold">
                {formatCurrency(filteredPayments.reduce((sum, p: AsaasPayment) => sum + (p.value || 0), 0))}
              </span>{' '}
              das {stats.total} cobranças existentes
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">1</span>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">Como posso ajudar?</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Pagamento */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID do Pagamento</label>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedPayment.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <div className="text-sm">{selectedPayment.description}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor</label>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedPayment.value)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div>
                      <Badge variant={
                        selectedPayment.status === 'PENDING' ? 'secondary' :
                        selectedPayment.status === 'RECEIVED' ? 'default' :
                        selectedPayment.status === 'OVERDUE' ? 'destructive' : 'outline'
                      }>
                        {selectedPayment.status === 'PENDING' ? 'Pendente' :
                         selectedPayment.status === 'RECEIVED' ? 'Recebido' :
                         selectedPayment.status === 'OVERDUE' ? 'Vencido' : selectedPayment.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
                    <div className="text-sm">
                      {selectedPayment.billingType === 'PIX' ? 'Pix' : 
                       selectedPayment.billingType === 'BOLETO' ? 'Boleto' : 
                       selectedPayment.billingType === 'CREDIT_CARD' ? 'Cartão de Crédito' : selectedPayment.billingType}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vencimento</label>
                    <div className="text-sm">{formatDate(selectedPayment.dueDate)}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informações do Cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <div className="text-sm">{selectedPayment.customerName || 'Não informado'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="text-sm">{selectedPayment.customerEmail || 'Não informado'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <div className="text-sm">{selectedPayment.customerPhone || 'Não informado'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CPF/CNPJ</label>
                    <div className="text-sm">{selectedPayment.customerCpfCnpj || 'Não informado'}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ações Disponíveis */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Ações Disponíveis</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resendPaymentMutation.mutate(selectedPayment.id)}
                    disabled={resendPaymentMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar Cobrança
                  </Button>
                  
                  {selectedPayment.status === 'RECEIVED' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refundPaymentMutation.mutate(selectedPayment.id)}
                      disabled={refundPaymentMutation.isPending}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Estornar Pagamento
                    </Button>
                  )}
                  
                  {selectedPayment.status !== 'RECEIVED' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => cancelPaymentMutation.mutate(selectedPayment.id)}
                      disabled={cancelPaymentMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar Pagamento
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}