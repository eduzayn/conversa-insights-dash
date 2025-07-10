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
  Calendar
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

  // Query para pagamentos com filtros
  const { data: paymentsData, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['/api/admin/asaas/payments', filters],
    queryFn: () => apiRequest('/api/admin/asaas/payments', {
      method: 'GET',
      searchParams: new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value && value !== 'all')
      )
    }),
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

  // Mutation para sincronizar
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/payments/sync', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Sincronização concluída",
        description: "Pagamentos sincronizados com sucesso!"
      });
      refetchPayments();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calcular estatísticas
  const payments = paymentsData || [];
  const stats = {
    total: payments.length,
    totalValue: payments.reduce((sum: number, p: Payment) => sum + p.amount, 0),
    pendingValue: payments.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + p.amount, 0),
    overdueValue: payments.filter((p: Payment) => p.status === 'overdue').reduce((sum: number, p: Payment) => sum + p.amount, 0),
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

  // Filtrar pagamentos
  const filteredPayments = payments.filter((payment: Payment) => {
    const matchesSearch = searchTerm === '' || 
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userId.toString().includes(searchTerm);
    
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
          {/* Cards de Estatísticas - Design igual à primeira imagem */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de cobranças</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valores pagos</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(0)}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valores pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingValue)}</p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vencidos</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueValue)}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros - Design igual à segunda imagem */}
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
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ID do Usuário</Label>
                  <Input
                    placeholder="ID do usuário"
                    value={filters.userId}
                    onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    placeholder="dd/mm/aaaa"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Pagamentos - Design igual à primeira imagem */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pagamentos</CardTitle>
                <CardDescription>{filteredPayments.length} pagamento(s) encontrado(s)</CardDescription>
              </div>
              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando pagamentos...</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Dados de pagamento inválidos
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {filteredPayments.map((payment: Payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>{payment.userId}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatDate(payment.dueDate)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>{getPaymentMethodText(payment.paymentMethod)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {payment.paymentUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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