import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, DollarSign, TrendingUp, Users, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';

interface AsaasMetrics {
  totalPayments: number;
  totalValue: number;
  receivedValue: number;
  pendingValue: number;
  overdueValue: number;
  receivedPayments: number;
  uniqueCustomers: number;
}

interface AsaasPayment {
  id: number;
  asaasId: string;
  customerId: string;
  value: number;
  description: string;
  billingType: string;
  status: string;
  dueDate: string;
  dateCreated: string;
  confirmedDate?: string;
  paymentDate?: string;
  customerName: string;
  customerEmail?: string;
  customerCpfCnpj?: string;
  customerPhone?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  paymentUrl?: string;
}

interface AsaasPaymentsResponse {
  payments: AsaasPayment[];
  total: number;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const billingTypeLabels = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  UNDEFINED: 'Indefinido',
};

export default function Cobrancas() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingTypeFilter, setBillingTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Buscar métricas do cache
  const { data: metrics, isLoading: metricsLoading } = useQuery<AsaasMetrics>({
    queryKey: ['/api/admin/asaas/cache/metrics'],
    queryFn: () => apiRequest('/api/admin/asaas/cache/metrics'),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar cobranças do cache
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<AsaasPaymentsResponse>({
    queryKey: ['/api/admin/asaas/cache/payments', currentPage, statusFilter, billingTypeFilter, searchTerm],
    queryFn: () => apiRequest('/api/admin/asaas/cache/payments', {
      params: {
        page: currentPage,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
        billingType: billingTypeFilter === 'all' ? undefined : billingTypeFilter,
        search: searchTerm || undefined,
      },
    }),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Mutation para sincronizar dados
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/cache/sync', { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data.message || 'Sincronização concluída com sucesso');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/cache/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/cache/payments'] });
      setIsSyncing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro na sincronização');
      setIsSyncing(false);
    },
  });

  const handleSync = () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: 'Pendente',
      RECEIVED: 'Recebido',
      OVERDUE: 'Vencido',
      CONFIRMED: 'Confirmado',
      REFUNDED: 'Reembolsado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const totalPages = Math.ceil((paymentsData?.total || 0) / 20);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobranças Asaas</h1>
          <p className="text-gray-600">Gerencie e monitore suas cobranças</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.totalPayments || 0}
            </div>
            <p className="text-xs text-gray-600">
              {metricsLoading ? '...' : `${metrics?.receivedPayments || 0} recebidas`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : formatCurrency(metrics?.totalValue || 0)}
            </div>
            <p className="text-xs text-gray-600">
              {metricsLoading ? '...' : `${formatCurrency(metrics?.receivedValue || 0)} recebidos`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : formatCurrency(metrics?.pendingValue || 0)}
            </div>
            <p className="text-xs text-gray-600">
              {metricsLoading ? '...' : `${formatCurrency(metrics?.overdueValue || 0)} vencidos`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.uniqueCustomers || 0}
            </div>
            <p className="text-xs text-gray-600">
              Clientes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome do cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="billingType">Tipo de Cobrança</Label>
              <Select value={billingTypeFilter} onValueChange={setBillingTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setBillingTypeFilter('all');
                  setCurrentPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando cobranças...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData?.payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.customerName}</div>
                          <div className="text-sm text-gray-600">{payment.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.value / 100)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {billingTypeLabels[payment.billingType as keyof typeof billingTypeLabels] || payment.billingType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payment.status as keyof typeof statusColors]}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {payment.invoiceUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.invoiceUrl, '_blank')}
                            >
                              Ver Fatura
                            </Button>
                          )}
                          {payment.bankSlipUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.bankSlipUrl, '_blank')}
                            >
                              Ver Boleto
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
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, paymentsData?.total || 0)} de {paymentsData?.total || 0} resultados
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}