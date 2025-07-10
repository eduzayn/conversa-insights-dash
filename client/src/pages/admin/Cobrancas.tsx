import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, RefreshCw, Download, Filter, Eye, CreditCard, Zap, BarChart3, Users, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Charge {
  id: number;
  asaasId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  value: number;
  netValue: number;
  description: string;
  billingType: string;
  status: string;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixQrCode: string | null;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChargeResponse {
  charges: Charge[];
  hasMore: boolean;
  total: number;
  page: number;
  limit: number;
}

const statusColors = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'CONFIRMED': 'bg-green-100 text-green-800',
  'RECEIVED': 'bg-green-100 text-green-800',
  'OVERDUE': 'bg-red-100 text-red-800',
  'CANCELLED': 'bg-gray-100 text-gray-800',
  'REFUNDED': 'bg-blue-100 text-blue-800'
};

const statusLabels = {
  'PENDING': 'Pendente',
  'CONFIRMED': 'Confirmado',
  'RECEIVED': 'Recebido',
  'OVERDUE': 'Vencido',
  'CANCELLED': 'Cancelado',
  'REFUNDED': 'Reembolsado'
};

const billingTypeLabels = {
  'PIX': 'PIX',
  'BOLETO': 'Boleto',
  'CREDIT_CARD': 'Cartão de Crédito',
  'DEBIT_CARD': 'Cartão de Débito',
  'UNDEFINED': 'Indefinido'
};

export default function Cobrancas() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver>();
  const lastElementRef = useRef<HTMLDivElement>();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch charges with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['charges', debouncedSearch, status],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        status: status,
        search: debouncedSearch
      });

      const response = await fetch(`/api/admin/asaas/charges?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar cobranças');
      }

      return response.json() as Promise<ChargeResponse>;
    },
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1
  });

  // Sincronização
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/asaas/sync-charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Intersection Observer para scroll infinito
  const lastElementCallback = useCallback((node: HTMLDivElement) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Métricas calculadas
  const allCharges = data?.pages.flatMap(page => page.charges) || [];
  const totalCharges = data?.pages[0]?.total || 0;
  const totalValue = allCharges.reduce((sum, charge) => sum + charge.value, 0);
  const pendingCharges = allCharges.filter(c => c.status === 'PENDING').length;
  const overdueCharges = allCharges.filter(c => c.status === 'OVERDUE').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    const label = statusLabels[status as keyof typeof statusLabels] || status;
    
    return (
      <Badge className={colorClass}>
        {label}
      </Badge>
    );
  };

  const getBillingTypeIcon = (type: string) => {
    switch (type) {
      case 'PIX':
        return <Zap className="h-4 w-4" />;
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranças Asaas</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todas as cobranças sincronizadas do Asaas
          </p>
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
          Sincronizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCharges.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              +{allCharges.length} carregadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Das cobranças carregadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCharges}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCharges}</div>
            <p className="text-xs text-muted-foreground">
              Em atraso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, email ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="RECEIVED">Recebido</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças</CardTitle>
          <CardDescription>
            {totalCharges > 0 ? `${totalCharges} cobranças encontradas` : 'Nenhuma cobrança encontrada'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando cobranças...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Erro ao carregar cobranças</p>
              <Button onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          ) : allCharges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma cobrança encontrada</p>
              <Button 
                onClick={() => syncMutation.mutate()} 
                className="mt-2"
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar com Asaas
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allCharges.map((charge, index) => (
                <div
                  key={charge.id}
                  ref={index === allCharges.length - 1 ? lastElementCallback : undefined}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getBillingTypeIcon(charge.billingType)}
                          <span className="font-medium">
                            {billingTypeLabels[charge.billingType as keyof typeof billingTypeLabels] || charge.billingType}
                          </span>
                        </div>
                        {getStatusBadge(charge.status)}
                        <span className="text-sm text-muted-foreground">
                          ID: {charge.asaasId}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">{charge.customerName}</p>
                          <p className="text-sm text-muted-foreground">{charge.customerEmail}</p>
                          {charge.description && (
                            <p className="text-sm text-muted-foreground mt-1">{charge.description}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(charge.value)}
                          </p>
                          {charge.netValue !== charge.value && (
                            <p className="text-sm text-muted-foreground">
                              Líquido: {formatCurrency(charge.netValue)}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Vencimento:</span> {formatDate(charge.dueDate)}
                          </p>
                          {charge.paymentDate && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Pagamento:</span> {formatDate(charge.paymentDate)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em {formatDate(charge.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {charge.invoiceUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(charge.invoiceUrl!, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Fatura
                        </Button>
                      )}
                      {charge.bankSlipUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(charge.bankSlipUrl!, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Boleto
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando mais cobranças...</span>
                </div>
              )}
              
              {!hasNextPage && allCharges.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Todas as cobranças foram carregadas ({allCharges.length} de {totalCharges})
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}