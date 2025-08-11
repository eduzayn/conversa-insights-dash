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
import { apiRequest } from '@/lib/queryClient';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

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

const IntegracaoAsaas: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para filtros e paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [billingTypeFilter, setBillingTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Query para buscar cobranças do Asaas
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useQuery({
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
    }
  });

  // Query para estatísticas
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/asaas/payments/stats'],
    queryFn: () => apiRequest('/api/asaas/payments/stats')
  });

  // Query para status de sincronização
  const { data: syncStatus, isLoading: isLoadingSyncStatus } = useQuery({
    queryKey: ['/api/asaas/sync/status'],
    queryFn: () => apiRequest('/api/asaas/sync/status')
  });

  // Query para testar conexão
  const { data: connectionTest, isLoading: isTestingConnection } = useQuery({
    queryKey: ['/api/asaas/test-connection'],
    queryFn: () => apiRequest('/api/asaas/test-connection')
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

  // Função para obter a cor do tipo de cobrança
  const getBillingTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'bg-purple-100 text-purple-800';
      case 'PIX':
        return 'bg-green-100 text-green-800';
      case 'BOLETO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Função para cancelar cobrança
  const handleCancelCharge = async (paymentId: string) => {
    try {
      if (!confirm('Tem certeza que deseja cancelar esta cobrança?')) {
        return;
      }

      await apiRequest(`/api/asaas/payments/${paymentId}/cancel`, { method: 'POST' });
      
      toast({
        title: 'Sucesso',
        description: 'Cobrança cancelada com sucesso!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/asaas/payments/stats'] });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cancelar cobrança',
        variant: 'destructive'
      });
    }
  };

  // Função para enviar lembrete
  const handleSendReminder = async (paymentId: string) => {
    try {
      const reminderType = prompt('Tipo de lembrete:\n1 - Email\n2 - SMS\n3 - Ambos\n\nDigite o número:');
      
      let type = 'email';
      if (reminderType === '2') type = 'sms';
      if (reminderType === '3') type = 'both';

      await apiRequest(`/api/asaas/payments/${paymentId}/reminder`, {
        method: 'POST',
        body: JSON.stringify({ type })
      });

      toast({
        title: 'Sucesso',
        description: 'Lembrete enviado com sucesso!'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar lembrete',
        variant: 'destructive'
      });
    }
  };

  // Função para gerar relatório financeiro
  const handleGenerateReport = async () => {
    try {
      const startDate = prompt('Data de início (YYYY-MM-DD):');
      const endDate = prompt('Data de fim (YYYY-MM-DD):');
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const report = await apiRequest(`/api/asaas/reports/financial?${params}`);
      
      // Criar e baixar arquivo
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório gerado e baixado com sucesso!'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar relatório',
        variant: 'destructive'
      });
    }
  };

  // Função para configurar notificações automáticas
  const handleConfigureNotifications = async () => {
    try {
      const emailEnabled = confirm('Habilitar notificações por email?');
      const smsEnabled = confirm('Habilitar notificações por SMS?');
      const reminderDaysBefore = parseInt(prompt('Quantos dias antes do vencimento enviar lembrete?') || '3');
      const overdueReminderDays = parseInt(prompt('Quantos dias após vencimento enviar lembrete?') || '7');

      await apiRequest('/api/asaas/notifications/configure', {
        method: 'POST',
        body: JSON.stringify({
          emailEnabled,
          smsEnabled,
          reminderDaysBefore,
          overdueReminderDays,
        })
      });

      toast({
        title: 'Sucesso',
        description: 'Configurações de notificação atualizadas com sucesso!'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao configurar notificações',
        variant: 'destructive'
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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-6">
          {/* Cabeçalho da página */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Integração Asaas</h1>
                <p className="text-muted-foreground">
                  Gerencie cobranças e pagamentos diretamente pelo Asaas
                </p>
              </div>
            </div>
            
            {/* Status da conexão */}
            <div className="flex items-center space-x-2">
              {isTestingConnection ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Testando conexão...</span>
                </div>
              ) : connectionTest?.success ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Erro de conexão</span>
                </div>
              )}
            </div>
          </div>

          {/* Cards de estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Cobranças
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.total.value)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pendentes
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.pending.value)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Confirmadas
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.confirmed.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.confirmed.value)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vencidas
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overdue.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.overdue.value)}
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
              <TabsTrigger value="settings">Configurações</TabsTrigger>
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
                          setStatusFilter('');
                          setBillingTypeFilter('');
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
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSendReminder(payment.id)}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelCharge(payment.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
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
                            Página {currentPage} de {totalPages}
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
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
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
                    <Button onClick={handleGenerateReport}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Gerar Relatório Personalizado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Configurações */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Configure notificações e webhooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={handleConfigureNotifications}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Notificações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default IntegracaoAsaas;