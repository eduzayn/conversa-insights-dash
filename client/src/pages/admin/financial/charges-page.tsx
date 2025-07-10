import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  Check,
  CreditCard,
  FileText,
  Plus,
  Search,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Filter,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  Settings,
  Mail,
  MessageSquare,
  X,
  Edit,
  Copy,
  Files,
  Send,
  ArrowLeft
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

// Interfaces para tipagem do TypeScript
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

const ChargesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para filtros e paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [billingTypeFilter, setBillingTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados para modais
  const [selectedPayment, setSelectedPayment] = useState<AsaasPayment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateChargeModalOpen, setIsCreateChargeModalOpen] = useState(false);

  // Estados para criação de cobrança
  const [newCharge, setNewCharge] = useState({
    customerName: '',
    customerEmail: '',
    customerCpfCnpj: '',
    customerMobilePhone: '',
    billingType: 'BOLETO',
    value: '',
    dueDate: '',
    description: ''
  });

  // Forçar scroll ao topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Query para buscar cobranças do Asaas
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments, error: paymentsError } = useQuery({
    queryKey: ['/api/asaas/payments', currentPage, statusFilter, billingTypeFilter, searchTerm, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(billingTypeFilter && billingTypeFilter !== 'all' && { billingType: billingTypeFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      return apiRequest(`/api/asaas/payments?${params}`);
    },
    retry: false,
    enabled: true
  });

  // Query para estatísticas com filtros dinâmicos
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['/api/asaas/payments/stats', statusFilter, billingTypeFilter, searchTerm, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(billingTypeFilter && billingTypeFilter !== 'all' && { billingType: billingTypeFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      return apiRequest(`/api/asaas/payments/stats?${params}`);
    },
    retry: false,
    enabled: true
  });

  // Query para status de sincronização
  const { data: syncStatus, isLoading: isLoadingSyncStatus, error: syncError } = useQuery({
    queryKey: ['/api/asaas/sync/status'],
    queryFn: () => apiRequest('/api/asaas/sync/status'),
    retry: false,
    enabled: true
  });

  // Query para testar conexão
  const { data: connectionTest, isLoading: isTestingConnection, error: connectionError } = useQuery({
    queryKey: ['/api/asaas/test-connection'],
    queryFn: () => apiRequest('/api/asaas/test-connection'),
    retry: false,
    enabled: true
  });

  // Mutation para importar cobranças
  const importPaymentsMutation = useMutation({
    mutationFn: () => apiRequest('/api/asaas/payments/import', { method: 'POST' }),
    onSuccess: (result) => {
      toast({
        title: 'Importação concluída',
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/sync/status'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para sincronizar cobranças
  const syncPaymentsMutation = useMutation({
    mutationFn: () => apiRequest('/api/asaas/payments/sync', { method: 'POST' }),
    onSuccess: (result) => {
      toast({
        title: 'Sincronização concluída',
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/sync/status'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na sincronização',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir cobrança
  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => apiRequest(`/api/asaas/payments/${paymentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: 'Cobrança excluída',
        description: 'A cobrança foi excluída com sucesso no Asaas',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments/stats'] });
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a cobrança',
        variant: 'destructive',
      });
    }
  });

  // Mutation para criar cobrança
  const createChargeMutation = useMutation({
    mutationFn: async () => {
      // 1. Primeiro, criar o cliente no Asaas
      const customerData = {
        name: newCharge.customerName,
        email: newCharge.customerEmail,
        cpfCnpj: newCharge.customerCpfCnpj,
        mobilePhone: newCharge.customerMobilePhone
      };

      const customer = await apiRequest('/api/asaas/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });

      // 2. Depois, criar a cobrança usando o ID do cliente
      const chargeData = {
        customer: customer.id,
        billingType: newCharge.billingType,
        value: parseFloat(newCharge.value),
        dueDate: newCharge.dueDate,
        description: newCharge.description
      };

      return await apiRequest('/api/asaas/payments', {
        method: 'POST',
        body: JSON.stringify(chargeData)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Cobrança criada com sucesso!',
        description: 'Cliente e cobrança foram criados no Asaas',
      });
      // Resetar formulário e fechar modal
      setNewCharge({
        customerName: '',
        customerEmail: '',
        customerCpfCnpj: '',
        customerMobilePhone: '',
        billingType: 'BOLETO',
        value: '',
        dueDate: '',
        description: ''
      });
      setIsCreateChargeModalOpen(false);
      // Atualizar tabela
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cobrança',
        description: error.message || 'Falha ao criar cliente ou cobrança no Asaas',
        variant: 'destructive',
      });
    },
  });

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  // Função para obter a cor do tipo de cobrança
  const getBillingTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'PIX':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'BOLETO':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Função para obter o texto do status
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

  // Função para obter o texto do tipo de cobrança
  const getBillingTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'PIX': 'PIX',
      'BOLETO': 'Boleto',
      'DEBIT_CARD': 'Cartão de Débito'
    };
    return typeMap[type] || type;
  };

  // Funções de manipulação de cobranças - Padrão Asaas
  const handleCopyPaymentLink = async (paymentId: string) => {
    try {
      const invoiceData = await apiRequest(`/api/asaas/payments/${paymentId}/invoice-url`);
      await navigator.clipboard.writeText(invoiceData.invoiceUrl);
      toast({
        title: 'Link copiado!',
        description: 'Link da cobrança copiado para a área de transferência',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao copiar link',
        description: error.message || 'Não foi possível obter o link da cobrança',
        variant: 'destructive',
      });
    }
  };

  const handleViewPaymentDetails = async (paymentId: string) => {
    try {
      const payment = await apiRequest(`/api/asaas/payments/${paymentId}`);
      setSelectedPayment(payment);
      setIsDetailsModalOpen(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: error.message || 'Não foi possível carregar os detalhes da cobrança',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = (payment: AsaasPayment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePayment = () => {
    if (selectedPayment) {
      deletePaymentMutation.mutate(selectedPayment.id);
    }
  };

  const handleSendReminder = async (paymentId: string) => {
    try {
      await apiRequest(`/api/asaas/payments/${paymentId}/reminder`, {
        method: 'POST',
        body: JSON.stringify({ type: 'email' })
      });

      toast({
        title: 'Lembrete enviado',
        description: 'Lembrete por email enviado com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar lembrete',
        description: error.message || 'Não foi possível enviar o lembrete',
        variant: 'destructive',
      });
    }
  };

  // Calcular total de páginas
  const totalItems = paymentsData?.totalCount || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Função para navegar entre páginas
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {/* Cabeçalho da página */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pagamentos Asaas</h1>
              <p className="text-muted-foreground">
                Gerencie cobranças e pagamentos diretamente pelo Asaas
              </p>
            </div>
          </div>

          <div className="space-y-6">
      {/* Status da conexão */}
      {isTestingConnection ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Testando conexão com Asaas...
          </AlertDescription>
        </Alert>
      ) : connectionTest?.success ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Conectado com sucesso ao Asaas
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Erro de conexão com Asaas. Verifique suas credenciais.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de estatísticas dinâmicas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Cobranças
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total?.count || 0}</div>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.total?.value || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Aguardando Pagamento
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pending?.count || 0}</div>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.pending?.value || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Confirmadas
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.confirmed?.count || 0}</div>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.confirmed?.value || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Vencidas
              </CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.overdue?.count || 0}</div>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(stats.overdue?.value || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas principais */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="create">Criar Cobrança</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba de Pagamentos */}
        <TabsContent value="payments" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou email do cliente"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

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
                      <SelectItem value="RECEIVED">Recebido</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={billingTypeFilter} onValueChange={setBillingTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setBillingTypeFilter('all');
                      setStartDate('');
                      setEndDate('');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => syncPaymentsMutation.mutate()}
                    disabled={syncPaymentsMutation.isPending}
                    variant="outline"
                  >
                    {syncPaymentsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </Button>

                  <Button
                    onClick={() => importPaymentsMutation.mutate()}
                    disabled={importPaymentsMutation.isPending}
                  >
                    {importPaymentsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Importar Todos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pagamentos</CardTitle>
              <CardDescription>
                {totalItems} cobranças encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsData?.data?.map((payment: AsaasPayment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-xs">
                              {payment.id.slice(-8)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {payment.customerData?.name || payment.customer}
                                </div>
                                {payment.customerData?.email && (
                                  <div className="text-sm text-muted-foreground">
                                    {payment.customerData.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payment.value)}
                            </TableCell>
                            <TableCell>{payment.description}</TableCell>
                            <TableCell>
                              <Badge className={getBillingTypeColor(payment.billingType)}>
                                {getBillingTypeText(payment.billingType)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(payment.dueDate)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payment.status)}>
                                {getStatusText(payment.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyPaymentLink(payment.id)}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copiar link da cobrança</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewPaymentDetails(payment.id)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Visualizar detalhes</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSendReminder(payment.id)}
                                      >
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Enviar lembrete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePayment(payment)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Excluir cobrança</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between space-x-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages} - {totalItems} cobranças
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        
                        {/* Números das páginas */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = Math.max(1, currentPage - 2) + i;
                          if (pageNumber <= totalPages) {
                            return (
                              <Button
                                key={pageNumber}
                                variant={pageNumber === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </Button>
                            );
                          }
                          return null;
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Criar Cobrança */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Cobrança</CardTitle>
              <CardDescription>
                Crie uma nova cobrança no Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Formulário de Cobrança</h3>
                <p className="text-muted-foreground mb-4">
                  Em breve: formulário completo para criar cobranças
                </p>
                <Button onClick={() => setIsCreateChargeModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Cobrança
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Sincronização */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Status da Sincronização</CardTitle>
              <CardDescription>
                Monitore e gerencie a sincronização com o Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncStatus && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className={`text-lg ${syncStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {syncStatus.isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Última Sincronização</label>
                      <p className="text-lg">
                        {syncStatus.lastSync ? formatDate(syncStatus.lastSync) : 'Nunca'}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={() => syncPaymentsMutation.mutate()}
                      disabled={syncPaymentsMutation.isPending}
                    >
                      {syncPaymentsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sincronizar Agora
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => importPaymentsMutation.mutate()}
                      disabled={importPaymentsMutation.isPending}
                    >
                      {importPaymentsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Importar Histórico
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Relatórios */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Gere relatórios detalhados das suas cobranças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gerar Relatório Personalizado
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Cobrança */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Cobrança</DialogTitle>
            <DialogDescription>
              Informações completas da cobrança {selectedPayment?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informações Básicas</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID da Cobrança</label>
                      <p className="font-mono text-sm">{selectedPayment.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valor</label>
                      <p className="text-lg font-semibold">{formatCurrency(selectedPayment.value)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedPayment.status)}>
                          {getStatusText(selectedPayment.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo de Cobrança</label>
                      <div className="mt-1">
                        <Badge className={getBillingTypeColor(selectedPayment.billingType)}>
                          {getBillingTypeText(selectedPayment.billingType)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
                      <p>{formatDate(selectedPayment.dueDate)}</p>
                    </div>
                    {selectedPayment.paymentDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Data do Pagamento</label>
                        <p>{formatDate(selectedPayment.paymentDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações do Cliente */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informações do Cliente</h3>
                  <div className="space-y-3">
                    {selectedPayment.customerData ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nome</label>
                          <p>{selectedPayment.customerData.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p>{selectedPayment.customerData.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">CPF/CNPJ</label>
                          <p>{selectedPayment.customerData.cpfCnpj}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ID do Cliente</label>
                        <p className="font-mono text-sm">{selectedPayment.customer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Descrição */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Descrição</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedPayment.description || 'Sem descrição'}
                </p>
              </div>

              {/* Ações */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => handleCopyPaymentLink(selectedPayment.id)}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button
                  onClick={() => handleSendReminder(selectedPayment.id)}
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Lembrete
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleDeletePayment(selectedPayment);
                  }}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Cobrança
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cobrança</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedPayment.id.slice(-8)}
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span> {formatCurrency(selectedPayment.value)}
                  </div>
                  <div>
                    <span className="font-medium">Cliente:</span> {selectedPayment.customerData?.name || selectedPayment.customer}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {getStatusText(selectedPayment.status)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeletePayment}
                  disabled={deletePaymentMutation.isPending}
                >
                  {deletePaymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Excluir Definitivamente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criar Nova Cobrança */}
      <Dialog open={isCreateChargeModalOpen} onOpenChange={setIsCreateChargeModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Cobrança</DialogTitle>
            <DialogDescription>
              Criar nova cobrança no Asaas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nome Completo *</Label>
                  <Input
                    id="customerName"
                    value={newCharge.customerName}
                    onChange={(e) => setNewCharge({...newCharge, customerName: e.target.value})}
                    placeholder="João da Silva"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">E-mail *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={newCharge.customerEmail}
                    onChange={(e) => setNewCharge({...newCharge, customerEmail: e.target.value})}
                    placeholder="joao@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerCpfCnpj">CPF ou CNPJ *</Label>
                  <Input
                    id="customerCpfCnpj"
                    value={newCharge.customerCpfCnpj}
                    onChange={(e) => setNewCharge({...newCharge, customerCpfCnpj: e.target.value})}
                    placeholder="12345678900"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerMobilePhone">Telefone Celular *</Label>
                  <Input
                    id="customerMobilePhone"
                    value={newCharge.customerMobilePhone}
                    onChange={(e) => setNewCharge({...newCharge, customerMobilePhone: e.target.value})}
                    placeholder="31999999999"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados da Cobrança */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados da Cobrança</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingType">Forma de Pagamento *</Label>
                  <Select value={newCharge.billingType} onValueChange={(value) => setNewCharge({...newCharge, billingType: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Valor (R$) *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={newCharge.value}
                    onChange={(e) => setNewCharge({...newCharge, value: e.target.value})}
                    placeholder="99.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Data de Vencimento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newCharge.dueDate}
                    onChange={(e) => setNewCharge({...newCharge, dueDate: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newCharge.description}
                    onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
                    placeholder="Parcela 1 de 12 - Curso XYZ"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateChargeModalOpen(false)}
                disabled={createChargeMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createChargeMutation.mutate()}
                disabled={createChargeMutation.isPending || !newCharge.customerName || !newCharge.customerEmail || !newCharge.customerCpfCnpj || !newCharge.customerMobilePhone || !newCharge.value || !newCharge.dueDate}
              >
                {createChargeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Adicionar Cobrança
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChargesPage;