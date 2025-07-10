import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Filter,
  Eye,
  Copy,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Interfaces
interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  customerData?: {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
  };
  billingType: string;
  value: number;
  netValue: number;
  description: string;
  installment?: string;
  dueDate: string;
  status: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  paymentDate?: string;
}

interface AsaasStats {
  total: { count: number; value: number };
  pending: { count: number; value: number };
  confirmed: { count: number; value: number };
  overdue: { count: number; value: number };
  thisMonth: { count: number; value: number };
  lastMonth: { count: number; value: number };
  byBillingType: Record<string, { count: number; value: number }>;
}

interface SyncStatus {
  isActive: boolean;
  lastSync: string | null;
  totalLocalPayments: number;
  syncedPayments: number;
  syncFrequency: string;
  nextSync: string;
}

interface ConnectionStatus {
  connected: boolean;
  apiKey: string;
  environment: string;
  lastTest: string | null;
}

const ChargesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('payments');

  // Query para testar conexão
  const { data: connectionStatus, isLoading: isLoadingConnection, refetch: refetchConnection } = useQuery({
    queryKey: ['/api/asaas/connection-test'],
    queryFn: async () => {
      const response = await fetch('/api/asaas/connection-test', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao testar conexão');
      }
      
      return response.json();
    }
  });

  // Query para buscar pagamentos
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['/api/asaas/payments', currentPage, statusFilter, searchTerm, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateFilter && { dateFilter })
      });

      const response = await fetch(`/api/asaas/payments?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar pagamentos');
      }
      
      return response.json();
    }
  });

  // Mutation para teste de conexão
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/asaas/connection-test', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro no teste de conexão');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: result.connected ? 'Conexão bem-sucedida' : 'Falha na conexão',
        description: result.message,
        variant: result.connected ? 'default' : 'destructive'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/connection-test'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no teste',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para sincronização
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/asaas/sync', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro na sincronização');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: 'Sincronização concluída',
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'RECEIVED': 'Recebido',
      'OVERDUE': 'Vencido',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getBillingTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'PIX': 'PIX',
      'BOLETO': 'Boleto',
      'DEBIT_CARD': 'Cartão de Débito'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integração Asaas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos e cobranças através do gateway Asaas
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Status da Integração */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status da Integração
            </CardTitle>
          </div>
          <Button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="flex items-center gap-2"
          >
            {testConnectionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Testar Conexão
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingConnection ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando conexão...</span>
            </div>
          ) : connectionStatus?.connected ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Conectado com sucesso ao ambiente {connectionStatus.environment}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não testado - Configure sua chave de API do Asaas
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="create">Criar Cobrança</TabsTrigger>
          <TabsTrigger value="enrollments">Teste Matrícula</TabsTrigger>
          <TabsTrigger value="webhooks">Teste Webhook</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>

        {/* Tab de Pagamentos */}
        <TabsContent value="payments" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ID do Usuário</label>
                  <Input
                    placeholder="ID do usuário"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Input
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Input
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pagamentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pagamentos</CardTitle>
              <Button
                onClick={() => refetchPayments()}
                disabled={isLoadingPayments}
                className="flex items-center gap-2"
              >
                {isLoadingPayments ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando pagamentos...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsData?.payments?.length ? (
                      paymentsData.payments.map((payment: AsaasPayment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            {payment.customerData?.name || payment.customer}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.description}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payment.value)}
                          </TableCell>
                          <TableCell>
                            {formatDate(payment.dueDate)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusText(payment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getBillingTypeText(payment.billingType)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                title="Copiar ID"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                title="Enviar lembrete"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Nenhum pagamento encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Paginação */}
              {paymentsData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Página {paymentsData.pagination.page} de {paymentsData.pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!paymentsData.pagination.hasNextPage}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Sincronização */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sincronização de Dados
              </CardTitle>
              <CardDescription>
                Sincronize os dados de pagamentos com a API do Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sincronizar Agora
                </Button>
                
                {syncMutation.isPending && (
                  <div className="text-sm text-gray-600">
                    Sincronizando dados... Isso pode levar alguns minutos.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChargesPage;