import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Eye, DollarSign, Calendar, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  clientPaymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  paymentUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerCpfCnpj?: string;
  customerPhone?: string;
  customerMobilePhone?: string;
  lastSyncAt: string;
}

interface PaymentsResponse {
  payments: AsaasPayment[];
  total: number;
}

const statusColors = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'RECEIVED': 'bg-green-100 text-green-800',
  'OVERDUE': 'bg-red-100 text-red-800',
  'CONFIRMED': 'bg-blue-100 text-blue-800',
  'AWAITING_RISK_ANALYSIS': 'bg-orange-100 text-orange-800',
  'CANCELLED': 'bg-gray-100 text-gray-800',
  'REFUNDED': 'bg-purple-100 text-purple-800',
};

const billingTypeLabels = {
  'PIX': 'PIX',
  'BOLETO': 'Boleto',
  'CREDIT_CARD': 'Cartão de Crédito',
  'UNDEFINED': 'Não definido',
};

const statusLabels = {
  'PENDING': 'Aguardando',
  'RECEIVED': 'Recebida',
  'OVERDUE': 'Vencida',
  'CONFIRMED': 'Confirmada',
  'AWAITING_RISK_ANALYSIS': 'Análise de Risco',
  'CANCELLED': 'Cancelada',
  'REFUNDED': 'Estornada',
};

export default function Cobrancas() {
  const [filters, setFilters] = useState({
    status: 'all',
    customerName: '',
    limit: 50,
    offset: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para buscar dados do cache local
  const { data: paymentsData, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ['/api/admin/asaas/cache/payments', filters],
    queryFn: () => apiRequest(`/api/admin/asaas/cache/payments?${new URLSearchParams({
      status: filters.status,
      customerName: filters.customerName,
      limit: filters.limit.toString(),
      offset: filters.offset.toString(),
    })}`),
  });

  // Query para métricas resumidas
  const { data: metrics } = useQuery({
    queryKey: ['/api/admin/asaas/cache/metrics'],
    queryFn: () => apiRequest('/api/admin/asaas/cache/metrics'),
  });

  // Mutation para sincronizar dados do Asaas
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/cache/sync', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/cache/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/cache/metrics'] });
      toast({
        title: "Sincronização Concluída",
        description: "Dados das cobranças foram atualizados com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na Sincronização",
        description: "Não foi possível sincronizar com o Asaas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      customerName: searchInput,
      offset: 0,
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status,
      offset: 0,
    }));
  };

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const maskCpfCnpj = (cpfCnpj?: string) => {
    if (!cpfCnpj) return '-';
    if (cpfCnpj.length <= 11) {
      return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    }
    return cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/****-$5');
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de sincronização */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cobranças</h1>
          <p className="text-gray-600">Gerencie suas cobranças do Asaas em cache local</p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {syncMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sincronizar Asaas
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total de Cobranças</p>
                <p className="text-2xl font-bold">{metrics?.totalPayments || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalValue || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Cobranças Pagas</p>
                <p className="text-2xl font-bold">{metrics?.receivedPayments || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Clientes Únicos</p>
                <p className="text-2xl font-bold">{metrics?.uniqueCustomers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="PENDING">Aguardando</SelectItem>
                  <SelectItem value="RECEIVED">Recebida</SelectItem>
                  <SelectItem value="OVERDUE">Vencida</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Cliente</label>
              <Input
                placeholder="Nome do cliente"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button onClick={handleSearch} className="w-full">
                Buscar
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ status: 'all', customerName: '', limit: 50, offset: 0 });
                  setSearchInput('');
                }}
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
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Cliente
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Valor
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Tipo
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Vencimento
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Contato
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsData?.payments?.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div>
                            <p className="font-medium">{payment.customerName || 'Cliente não informado'}</p>
                            <p className="text-sm text-gray-500">{maskCpfCnpj(payment.customerCpfCnpj)}</p>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          {formatCurrency(payment.value)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <Badge className={statusColors[payment.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                            {statusLabels[payment.status as keyof typeof statusLabels] || payment.status}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          {billingTypeLabels[payment.billingType as keyof typeof billingTypeLabels] || payment.billingType}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          {formatDate(payment.dueDate)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="text-sm">
                            {payment.customerEmail && (
                              <p className="truncate max-w-32">{payment.customerEmail}</p>
                            )}
                            {payment.customerPhone && (
                              <p>{formatPhone(payment.customerPhone)}</p>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="flex gap-2">
                            {payment.invoiceUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(payment.invoiceUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {paymentsData && paymentsData.payments && paymentsData.payments.length < paymentsData.total && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Carregar Mais ({paymentsData.payments.length} de {paymentsData.total})
                  </Button>
                </div>
              )}

              {(!paymentsData?.payments || paymentsData.payments.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma cobrança encontrada</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}