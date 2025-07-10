import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, DollarSign, RefreshCw, Search, TrendingUp, Users, AlertTriangle, CheckCircle, Clock, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AsaasPayment {
  id: number;
  asaasId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  value: number;
  description?: string;
  status: string;
  billingType?: string;
  dueDate?: string;
  paymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  createdAt: string;
}

interface AsaasResponse {
  charges: AsaasPayment[];
  hasMore: boolean;
  total: number;
  page: number;
  limit: number;
}

const statusMap = {
  'pending': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  'received': { label: 'Recebido', color: 'bg-green-100 text-green-800' },
  'overdue': { label: 'Vencido', color: 'bg-red-100 text-red-800' },
  'confirmed': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  'refunded': { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' }
};

const billingTypeMap = {
  'BOLETO': 'Boleto',
  'PIX': 'PIX',
  'CREDIT_CARD': 'Cartão'
};

export default function IntegracaoAsaas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [allCharges, setAllCharges] = useState<AsaasPayment[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Função para carregar dados paginados
  const loadCharges = useCallback(async (page: number, append = false) => {
    if (page > 1) setIsLoadingMore(true);
    
    try {
      const response = await apiRequest<AsaasResponse>(`/api/admin/asaas/charges?page=${page}&limit=20&status=${statusFilter}&search=${searchTerm}`);
      
      if (append) {
        setAllCharges(prev => [...prev, ...response.charges]);
      } else {
        setAllCharges(response.charges);
      }
      
      setHasMore(response.hasMore);
      return response;
    } catch (error) {
      console.error('Erro ao carregar cobranças:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cobranças",
        variant: "destructive"
      });
      throw error;
    } finally {
      if (page > 1) setIsLoadingMore(false);
    }
  }, [statusFilter, searchTerm]);

  // Carregar primeira página
  const { data: chargesData, isLoading, error } = useQuery({
    queryKey: ['asaas-charges', currentPage, statusFilter, searchTerm],
    queryFn: () => loadCharges(1, false),
    enabled: true
  });

  // Carregar mais dados
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      const nextPage = currentPage + 1;
      await loadCharges(nextPage, true);
      setCurrentPage(nextPage);
    }
  }, [currentPage, hasMore, isLoadingMore, loadCharges]);

  // Detectar scroll infinito
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  // Reset ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
    setAllCharges([]);
    setHasMore(true);
  }, [statusFilter, searchTerm]);

  // Testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/status', { method: 'GET' }),
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.success ? "Conexão com Asaas funcionando!" : "Falha na conexão",
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao testar conexão",
        variant: "destructive"
      });
    }
  });

  // Sincronizar pagamentos
  const syncPaymentsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/sync', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.message || "Sincronização concluída",
      });
      queryClient.invalidateQueries({ queryKey: ['asaas-charges'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro na sincronização",
        variant: "destructive"
      });
    }
  });

  // Limpar cache
  const clearCacheMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/cache/clear', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Cache limpo com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['asaas-charges'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao limpar cache",
        variant: "destructive"
      });
    }
  });

  // Métricas calculadas - verificação de segurança
  const safeCharges = allCharges || [];
  const metrics = {
    total: safeCharges.length,
    received: safeCharges.filter(c => c.status === 'received').length,
    pending: safeCharges.filter(c => c.status === 'pending').length,
    overdue: safeCharges.filter(c => c.status === 'overdue').length,
    totalValue: safeCharges.reduce((sum, c) => sum + (c.value || 0), 0) / 100
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar cobranças</h3>
        <p className="text-gray-500 mb-4">Verifique sua conexão e tente novamente</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Dashboard</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integração Asaas</h1>
            <p className="text-gray-500">Gerenciamento de cobranças e pagamentos</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
          >
            {testConnectionMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Testar Conexão
          </Button>
          <Button 
            onClick={() => syncPaymentsMutation.mutate()}
            disabled={syncPaymentsMutation.isPending}
          >
            {syncPaymentsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.received}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalValue.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="received">Recebidas</SelectItem>
            <SelectItem value="overdue">Vencidas</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={() => clearCacheMutation.mutate()}
          disabled={clearCacheMutation.isPending}
        >
          {clearCacheMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Limpar Cache
        </Button>
      </div>

      {/* Lista de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças Asaas</CardTitle>
          <CardDescription>
            Lista de todas as cobranças sincronizadas com scroll infinito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando cobranças...</span>
            </div>
          ) : (!allCharges || allCharges.length === 0) ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma cobrança encontrada</h3>
              <p className="text-gray-500">Sincronize com o Asaas para carregar as cobranças</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header da tabela */}
              <div className="hidden md:grid grid-cols-7 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <div>Cliente</div>
                <div>Valor</div>
                <div>Status</div>
                <div>Tipo</div>
                <div>Vencimento</div>
                <div>Criação</div>
                <div>Ações</div>
              </div>

              {/* Lista de cobranças */}
              {(allCharges || []).map((charge) => (
                <div 
                  key={charge.id} 
                  className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="md:col-span-1">
                    <div className="font-medium text-gray-900">
                      {charge.customerName || charge.customerId}
                    </div>
                    {charge.customerEmail && (
                      <div className="text-sm text-gray-500">{charge.customerEmail}</div>
                    )}
                  </div>
                  
                  <div className="md:col-span-1">
                    <div className="font-medium">
                      {(charge.value / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                  </div>
                  
                  <div className="md:col-span-1">
                    <Badge className={statusMap[charge.status]?.color || 'bg-gray-100 text-gray-800'}>
                      {statusMap[charge.status]?.label || charge.status}
                    </Badge>
                  </div>
                  
                  <div className="md:col-span-1">
                    <span className="text-sm text-gray-600">
                      {billingTypeMap[charge.billingType] || charge.billingType}
                    </span>
                  </div>
                  
                  <div className="md:col-span-1">
                    <span className="text-sm text-gray-600">
                      {charge.dueDate ? format(new Date(charge.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </span>
                  </div>
                  
                  <div className="md:col-span-1">
                    <span className="text-sm text-gray-600">
                      {format(new Date(charge.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="md:col-span-1">
                    {(charge.invoiceUrl || charge.bankSlipUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = charge.invoiceUrl || charge.bankSlipUrl;
                          if (url) window.open(url, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando mais cobranças...</span>
                </div>
              )}

              {/* No more data indicator */}
              {!hasMore && allCharges.length > 0 && (
                <div className="text-center py-4 text-gray-500">
                  Todas as cobranças foram carregadas
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}