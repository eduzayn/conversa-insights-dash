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
  Trash2,
  UserPlus,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
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

  const [testEnrollment, setTestEnrollment] = useState({
    studentId: 0,
    courseId: 0
  });

  const [testWebhook, setTestWebhook] = useState({
    event: '',
    paymentId: '',
    value: ''
  });

  // Mutation para testar matrícula
  const testEnrollmentMutation = useMutation({
    mutationFn: (data: { studentId: number; courseId: number }) => apiRequest('/api/admin/test-matricula', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      toast({
        title: "Matrícula de teste criada",
        description: "Matrícula realizada com sucesso! Cobrança criada automaticamente no Asaas.",
      });
      setTestEnrollment({ studentId: 0, courseId: 0 });
      // Recarregar pagamentos para mostrar a nova cobrança
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message || "Falha ao criar matrícula de teste",
        variant: "destructive"
      });
    }
  });

  // Mutation para testar webhook
  const testWebhookMutation = useMutation({
    mutationFn: (data: { event: string; paymentId: string; value: string }) => apiRequest('/api/admin/test-webhook', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      toast({
        title: "Webhook testado com sucesso",
        description: "Notificação processada corretamente!"
      });
      setTestWebhook({ event: '', paymentId: '', value: '' });
      // Recarregar pagamentos para mostrar atualizações
      queryClient.invalidateQueries({ queryKey: ['/api/admin/asaas/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao testar webhook",
        description: error.message || "Falha ao testar webhook",
        variant: "destructive"
      });
    }
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
        if (value && value !== 'all') params.append(key, value);
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

  const handleTestEnrollment = () => {
    if (!testEnrollment.studentId || !testEnrollment.courseId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o ID do aluno e ID do curso",
        variant: "destructive"
      });
      return;
    }

    testEnrollmentMutation.mutate(testEnrollment);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Integração Asaas</h1>
          <p className="text-muted-foreground">
            Gerencie pagamentos e cobranças através do gateway Asaas
          </p>
        </div>
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
          <TabsTrigger value="test">Teste Matrícula</TabsTrigger>
          <TabsTrigger value="webhook">Teste Webhook</TabsTrigger>
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
                      <SelectItem value="all">Todos</SelectItem>
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
                  {Array.isArray(payments) ? payments.map((payment) => (
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
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Dados de pagamento inválidos
                    </div>
                  )}
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

        {/* Aba de Teste de Matrícula */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Teste de Matrícula Automática
              </CardTitle>
              <CardDescription>
                Teste a criação automática de cobrança no Asaas quando um aluno se matricula
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como funciona:</strong> Ao matricular um aluno, o sistema automaticamente criará uma cobrança no Asaas com base no valor do curso.
                  Isso simula o fluxo real de matrícula onde o pagamento é gerado automaticamente.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testStudentId">ID do Aluno *</Label>
                  <Input
                    id="testStudentId"
                    type="number"
                    value={testEnrollment.studentId || ''}
                    onChange={(e) => setTestEnrollment({...testEnrollment, studentId: parseInt(e.target.value) || 0})}
                    placeholder="Ex: 1 (ID do aluno no sistema)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use ID 1 para aluno de teste (admin)
                  </p>
                </div>
                <div>
                  <Label htmlFor="testCourseId">ID do Curso *</Label>
                  <Input
                    id="testCourseId"
                    type="number"
                    value={testEnrollment.courseId || ''}
                    onChange={(e) => setTestEnrollment({...testEnrollment, courseId: parseInt(e.target.value) || 0})}
                    placeholder="Ex: 1 (ID do curso pré-cadastrado)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use qualquer ID de curso pré-cadastrado no sistema
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">O que acontece ao testar:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. ✅ Matrícula é criada no sistema</li>
                  <li>2. ✅ Cobrança é gerada automaticamente no banco local</li>
                  <li>3. ✅ Tentativa de criar cobrança no Asaas (requer API funcionando)</li>
                  <li>4. ✅ Cobrança aparece na aba "Pagamentos" acima</li>
                </ol>
              </div>
              
              <Button 
                onClick={handleTestEnrollment}
                disabled={testEnrollmentMutation.isPending}
                className="w-full"
                size="lg"
              >
                {testEnrollmentMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Testar Matrícula com Cobrança Automática
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Teste de Webhook */}
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Webhook</CardTitle>
              <CardDescription>
                Simule notificações do Asaas para testar o processamento de webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="webhookEvent">Evento *</Label>
                  <Select value={testWebhook.event} onValueChange={(value) => setTestWebhook({...testWebhook, event: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT_CREATED">Cobrança Criada</SelectItem>
                      <SelectItem value="PAYMENT_RECEIVED">Pagamento Recebido</SelectItem>
                      <SelectItem value="PAYMENT_CONFIRMED">Pagamento Confirmado</SelectItem>
                      <SelectItem value="PAYMENT_OVERDUE">Pagamento Vencido</SelectItem>
                      <SelectItem value="PAYMENT_REFUNDED">Pagamento Estornado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="webhookPaymentId">ID do Pagamento *</Label>
                  <Input 
                    id="webhookPaymentId" 
                    value={testWebhook.paymentId} 
                    onChange={(e) => setTestWebhook({...testWebhook, paymentId: e.target.value})}
                    placeholder="Ex: pay_123456789"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use um ID de pagamento existente no sistema
                  </p>
                </div>
                <div>
                  <Label htmlFor="webhookValue">Valor (R$)</Label>
                  <Input 
                    id="webhookValue" 
                    type="number" 
                    value={testWebhook.value} 
                    onChange={(e) => setTestWebhook({...testWebhook, value: e.target.value})}
                    placeholder="Ex: 100.00"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Como funciona:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. ✅ Webhook é enviado para /api/webhooks/asaas</li>
                  <li>2. ✅ Sistema busca o pagamento pelo ID externo</li>
                  <li>3. ✅ Status é atualizado automaticamente no banco</li>
                  <li>4. ✅ Logs são gerados para acompanhamento</li>
                </ol>
              </div>
              
              <Button 
                onClick={() => testWebhookMutation.mutate(testWebhook)}
                disabled={testWebhookMutation.isPending || !testWebhook.event || !testWebhook.paymentId}
                className="w-full"
                size="lg"
              >
                {testWebhookMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Testar Webhook
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