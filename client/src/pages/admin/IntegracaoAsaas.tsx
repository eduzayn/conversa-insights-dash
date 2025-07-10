import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Search,
  Eye,
  Copy,
  ArrowLeft,
  Download,
  AlertCircle,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Calendar,
  X,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AsaasPayment {
  id: string;
  customer: string;
  description: string;
  value: number;
  dueDate: string;
  status: string;
  billingType: string;
  invoiceUrl?: string;
  dateCreated: string;
  paymentDate?: string;
}

interface Payment {
  id: number;
  userId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  description: string;
  dueDate: string;
  paymentUrl?: string;
  createdAt: string;
}

export default function IntegracaoAsaas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    status: 'all',
    userId: '',
    startDate: '',
    endDate: ''
  });
  
  // Estado para busca
  const [searchTerm, setSearchTerm] = useState('');

  // Query para status da conexão
  const { data: connectionStatus, refetch: refetchConnection } = useQuery({
    queryKey: ['/api/admin/asaas/status'],
    queryFn: () => apiRequest('/api/admin/asaas/status'),
  });

  // Query para pagamentos do Asaas com filtros
  const { data: paymentsData, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['/api/admin/asaas/payments', filters],
    queryFn: () => apiRequest('/api/admin/asaas/payments', {
      method: 'GET',
      searchParams: new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value && value !== 'all')
      )
    }),
    refetchOnWindowFocus: false,
  });

  // Query para estatísticas
  const { data: statsData } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: () => apiRequest('/api/payments'),
  });

  // Mutation para testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/status', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: data.success ? "Conexão bem-sucedida" : "Falha na conexão",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      refetchConnection();
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para sincronizar/importar todas as cobranças
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/import-all', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Importação concluída",
        description: data.message || "Cobranças importadas com sucesso!"
      });
      refetchPayments();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calcular estatísticas usando dados do Asaas
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const stats = {
    total: payments.length,
    totalValue: payments.reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
    pendingValue: payments.filter((p: AsaasPayment) => p.status === 'PENDING').reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
    overdueValue: payments.filter((p: AsaasPayment) => p.status === 'OVERDUE').reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
  };

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: 'Confirmado', className: 'bg-green-100 text-green-800' },
      'overdue': { label: 'Vencido', className: 'bg-red-100 text-red-800' },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap = {
      'pix': 'PIX',
      'boleto': 'Boleto',
      'credit_card': 'Cartão de Crédito',
    };
    return methodMap[method as keyof typeof methodMap] || method;
  };

  // Filtrar pagamentos do Asaas
  const filteredPayments = payments.filter((payment: AsaasPayment) => {
    const matchesSearch = searchTerm === '' || 
      payment.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.includes(searchTerm);
    
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Integração Asaas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos e cobranças através do gateway Asaas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => refetchConnection()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar com Asaas
          </Button>
          <Button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="flex items-center gap-2"
          >
            {testConnectionMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Testar Conexão
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova cobrança
          </Button>
        </div>
      </div>

      {/* Status da Integração */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status da Integração
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {connectionStatus?.success ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Conectado com sucesso ao Asaas
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
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="create">Criar Cobrança</TabsTrigger>
          <TabsTrigger value="enrollments">Teste Matrícula</TabsTrigger>
          <TabsTrigger value="webhooks">Teste Webhook</TabsTrigger>
        </TabsList>

        {/* Tab de Cobranças/Pagamentos */}
        <TabsContent value="payments" className="space-y-6">
          {/* Cards de Estatísticas - Design idêntico ao Asaas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Total de cobranças</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Valores pagos</div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(0)}</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Valores pendentes</div>
              <div className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.pendingValue)}</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Vencidos</div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.overdueValue)}</div>
            </div>
          </div>

          {/* Interface idêntica ao Asaas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Procurar por nome ou email do cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Filtros ▼</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">1 Ações em lote ▼</span>
                  <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Adicionar cobrança
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabela idêntica ao Asaas */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Nome ↕</TableHead>
                    <TableHead className="font-semibold text-gray-700">Valor ↕</TableHead>
                    <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                    <TableHead className="font-semibold text-gray-700">Forma de pagamento ↕</TableHead>
                    <TableHead className="font-semibold text-gray-700">Data de vencimento ↕</TableHead>
                    <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Carregando cobranças...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhuma cobrança encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment: AsaasPayment) => (
                      <TableRow key={payment.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-sm font-medium">
                                {payment.customer?.charAt(0)?.toUpperCase() || 'C'}
                              </span>
                            </div>
                            <span className="font-medium">{payment.customer || 'Cliente'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.value)}</TableCell>
                        <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {payment.billingType === 'PIX' ? '🔴 Boleto Bancário / Pix' : 
                             payment.billingType === 'BOLETO' ? '🏦 Boleto Bancário / Pix' : 
                             payment.billingType === 'CREDIT_CARD' ? 'Pix' : 'Pix'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span>{formatDate(payment.dueDate)}</span>
                          <span className="ml-2 text-orange-600">🔴</span>
                          <span className="ml-1 text-orange-600">🟠</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-purple-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-purple-600">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-purple-600">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-purple-600">
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer da tabela idêntico ao Asaas */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {filteredPayments.length} cobranças no valor total de{' '}
                  <span className="font-semibold">
                    {formatCurrency(filteredPayments.reduce((sum, p: AsaasPayment) => sum + (p.value || 0), 0))}
                  </span>{' '}
                  das {stats.total} cobranças existentes
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">1</span>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500">Como posso ajudar?</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Outras tabs podem ser implementadas aqui */}
        <TabsContent value="create">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Funcionalidade de criar cobrança em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Funcionalidade de teste de matrícula em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Funcionalidade de teste de webhook em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}