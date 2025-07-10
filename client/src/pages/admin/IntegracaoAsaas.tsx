import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Upload,
  CreditCard,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  Settings,
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AsaasTestResult {
  success: boolean;
  message: string;
}

interface AsaasImportResult {
  imported: number;
  errors: string[];
}

interface AsaasSyncResult {
  synced: number;
  errors: string[];
}

interface Payment {
  id: number;
  userId: number;
  courseId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  externalId: string;
  description: string;
  dueDate: string;
  paidAt?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePaymentRequest {
  userId: number;
  courseId: number;
  amount: number;
  description: string;
  dueDate: string;
  paymentMethod: 'pix' | 'boleto' | 'credit_card';
}

export default function IntegracaoAsaas() {
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [newPayment, setNewPayment] = useState<CreatePaymentRequest>({
    userId: 0,
    courseId: 0,
    amount: 0,
    description: '',
    dueDate: '',
    paymentMethod: 'boleto'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para testar conexão
  const { data: connectionStatus, isLoading: testingConnection, refetch: testConnection } = useQuery({
    queryKey: ['/api/admin/asaas/status'],
    queryFn: () => apiRequest('/api/admin/asaas/status') as Promise<AsaasTestResult>,
    staleTime: 30000,
    retry: false
  });

  // Query para listar pagamentos
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['/api/admin/asaas/payments', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest(`/api/admin/asaas/payments?${params}`) as Promise<Payment[]>;
    },
    staleTime: 60000
  });

  // Mutation para importar pagamentos
  const importPaymentsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/payments/import', {
      method: 'POST'
    }) as Promise<AsaasImportResult>,
    onSuccess: (result) => {
      toast({
        title: "Importação concluída",
        description: `${result.imported} pagamentos importados com sucesso. ${result.errors.length} erros.`,
        variant: result.errors.length > 0 ? "destructive" : "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message || "Falha ao importar pagamentos",
        variant: "destructive"
      });
    }
  });

  // Mutation para sincronizar pagamentos
  const syncPaymentsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/payments/sync', {
      method: 'POST'
    }) as Promise<AsaasSyncResult>,
    onSuccess: (result) => {
      toast({
        title: "Sincronização concluída",
        description: `${result.synced} pagamentos sincronizados. ${result.errors.length} erros.`,
        variant: result.errors.length > 0 ? "destructive" : "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar pagamentos",
        variant: "destructive"
      });
    }
  });

  // Mutation para criar cobrança
  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => apiRequest('/api/admin/asaas/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Cobrança criada",
        description: "Cobrança criada com sucesso no Asaas",
      });
      setNewPayment({
        userId: 0,
        courseId: 0,
        amount: 0,
        description: '',
        dueDate: '',
        paymentMethod: 'boleto'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cobrança",
        description: error.message || "Falha ao criar cobrança",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'received': { label: 'Pago', className: 'bg-green-100 text-green-800' },
      'confirmed': { label: 'Confirmado', className: 'bg-green-100 text-green-800' },
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      'overdue': { label: 'Vencido', className: 'bg-red-100 text-red-800' },
      'refunded': { label: 'Estornado', className: 'bg-gray-100 text-gray-800' }
    };

    const variant = variants[status as keyof typeof variants] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCreatePayment = () => {
    if (!newPayment.userId || !newPayment.amount || !newPayment.description || !newPayment.dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    createPaymentMutation.mutate(newPayment);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integração Asaas</h1>
        <p className="text-muted-foreground">
          Gerencie pagamentos e cobranças através do gateway Asaas
        </p>
      </div>

      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {testingConnection ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : connectionStatus?.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">
                {testingConnection ? 'Testando conexão...' : connectionStatus?.message || 'Não testado'}
              </span>
            </div>
            <Button 
              onClick={() => testConnection()} 
              disabled={testingConnection}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="create">Criar Cobrança</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>

        {/* Aba de Pagamentos */}
        <TabsContent value="payments" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="received">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="refunded">Estornado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="userId">ID do Usuário</Label>
                  <Input
                    id="userId"
                    type="number"
                    value={filters.userId}
                    onChange={(e) => setFilters({...filters, userId: e.target.value})}
                    placeholder="ID do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pagamentos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pagamentos</CardTitle>
                <Button onClick={() => refetchPayments()} disabled={loadingPayments} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : !payments || payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento encontrado
                </div>
              ) : (
                <div className="space-y-4">
                  {(payments || []).map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-medium">{payment.description}</span>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor:</span>
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vencimento:</span>
                          <p>{formatDate(payment.dueDate)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Método:</span>
                          <p>{payment.paymentMethod}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ID Externo:</span>
                          <p>{payment.externalId || 'N/A'}</p>
                        </div>
                        <div>
                          {payment.paymentUrl && (
                            <Button asChild size="sm" variant="outline">
                              <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Cobrança
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Criar Cobrança */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Cobrança</CardTitle>
              <CardDescription>
                Crie uma nova cobrança no Asaas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newUserId">ID do Usuário *</Label>
                  <Input
                    id="newUserId"
                    type="number"
                    value={newPayment.userId || ''}
                    onChange={(e) => setNewPayment({...newPayment, userId: parseInt(e.target.value) || 0})}
                    placeholder="ID do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="newCourseId">ID do Curso</Label>
                  <Input
                    id="newCourseId"
                    type="number"
                    value={newPayment.courseId || ''}
                    onChange={(e) => setNewPayment({...newPayment, courseId: parseInt(e.target.value) || 0})}
                    placeholder="ID do curso (opcional)"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="newAmount">Valor (R$) *</Label>
                <Input
                  id="newAmount"
                  type="number"
                  step="0.01"
                  value={newPayment.amount || ''}
                  onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="newDescription">Descrição *</Label>
                <Textarea
                  id="newDescription"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                  placeholder="Descrição da cobrança"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newDueDate">Data de Vencimento *</Label>
                  <Input
                    id="newDueDate"
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="newPaymentMethod">Método de Pagamento *</Label>
                  <Select value={newPayment.paymentMethod} onValueChange={(value: any) => setNewPayment({...newPayment, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleCreatePayment}
                disabled={createPaymentMutation.isPending}
                className="w-full"
              >
                {createPaymentMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Criar Cobrança
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Sincronização */}
        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Importar Pagamentos
                </CardTitle>
                <CardDescription>
                  Importa todos os pagamentos do Asaas para o sistema local
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => importPaymentsMutation.mutate()}
                  disabled={importPaymentsMutation.isPending}
                  className="w-full"
                >
                  {importPaymentsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Importar Agora
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sincronizar Status
                </CardTitle>
                <CardDescription>
                  Atualiza o status dos pagamentos existentes com o Asaas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => syncPaymentsMutation.mutate()}
                  disabled={syncPaymentsMutation.isPending}
                  className="w-full"
                >
                  {syncPaymentsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar Agora
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Informações sobre o Webhook */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Webhook</CardTitle>
              <CardDescription>
                Configure o webhook no painel do Asaas para receber notificações automáticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label>URL do Webhook:</Label>
                  <Input 
                    value={`${window.location.origin}/api/webhooks/asaas`}
                    readOnly
                    className="mt-1"
                  />
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Configure esta URL no painel administrativo do Asaas para receber 
                    notificações automáticas sobre mudanças no status dos pagamentos.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}