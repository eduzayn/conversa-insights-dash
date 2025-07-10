import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Download, ExternalLink, Calendar, AlertCircle, CheckCircle, Clock, RefreshCw, AlertTriangle, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Payment {
  id: number;
  enrollment: {
    course: {
      nome: string;
      modalidade: string;
    };
  };
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  metodoPagamento?: string;
  referencia?: string;
  urlBoleto?: string;
  isRecorrente: boolean;
}

interface AsaasPayment {
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

interface PaymentStatusResponse {
  userId: number;
  canAccess: boolean;
  hasOverduePayments: boolean;
  overdueCount: number;
  totalPendingAmount: number;
  overduePayments: {
    id: number;
    amount: number;
    dueDate: string;
    description: string;
    paymentUrl?: string;
  }[];
}

export default function Pagamentos() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Recuperar usuário logado do localStorage
    const userData = localStorage.getItem('student');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Query para pagamentos do sistema interno (existente)
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/pagamentos'],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: [],
    placeholderData: []
  });

  // Query para pagamentos do Asaas (novo)
  const { data: asaasPayments = [], isLoading: loadingAsaasPayments, refetch: refetchAsaasPayments } = useQuery({
    queryKey: ['/api/payments', currentUser?.id],
    queryFn: () => apiRequest(`/api/payments?userId=${currentUser?.id}`) as Promise<AsaasPayment[]>,
    enabled: !!currentUser?.id,
    staleTime: 60000
  });

  // Query para verificar status de inadimplência do Asaas
  const { data: paymentStatus, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/users', currentUser?.id, 'payment-status'],
    queryFn: () => apiRequest(`/api/users/${currentUser?.id}/payment-status`) as Promise<PaymentStatusResponse>,
    enabled: !!currentUser?.id,
    staleTime: 30000
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'pago': { variant: 'default' as const, label: 'Pago', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
      'pendente': { variant: 'secondary' as const, label: 'Pendente', icon: Clock, color: 'text-yellow-700 bg-yellow-100' },
      'vencido': { variant: 'destructive' as const, label: 'Vencido', icon: AlertCircle, color: 'text-red-700 bg-red-100' },
      'cancelado': { variant: 'outline' as const, label: 'Cancelado', icon: AlertCircle, color: 'text-gray-700 bg-gray-100' },
      // Status do Asaas
      'received': { variant: 'default' as const, label: 'Recebido', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
      'confirmed': { variant: 'default' as const, label: 'Confirmado', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
      'overdue': { variant: 'destructive' as const, label: 'Vencido', icon: AlertTriangle, color: 'text-red-700 bg-red-100' },
      'refunded': { variant: 'outline' as const, label: 'Estornado', icon: RefreshCw, color: 'text-gray-700 bg-gray-100' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, icon: AlertCircle, color: 'text-gray-700 bg-gray-100' };
  };

  const getAsaasStatusBadge = (status: string) => {
    const variants = {
      'received': { 
        label: 'Pago', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle 
      },
      'confirmed': { 
        label: 'Confirmado', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle 
      },
      'pending': { 
        label: 'Pendente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock 
      },
      'overdue': { 
        label: 'Vencido', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle 
      },
      'refunded': { 
        label: 'Estornado', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: RefreshCw 
      }
    };

    const variant = variants[status as keyof typeof variants] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock 
    };
    
    const IconComponent = variant.icon;
    
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'pix': 'PIX',
      'boleto': 'Boleto',
      'credit_card': 'Cartão de Crédito'
    };
    return methods[method] || method;
  };

  const formatCurrencyAsaas = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDateAsaas = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isAsaasOverdue = (payment: AsaasPayment) => {
    return payment.status === 'overdue' || 
           (payment.status === 'pending' && new Date(payment.dueDate) < new Date());
  };

  const handleRefreshAsaas = () => {
    refetchAsaasPayments();
    refetchStatus();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100); // valor em centavos
  };

  const isOverdue = (vencimento: string, status: string) => {
    if (status === 'pago') return false;
    return new Date(vencimento) < new Date();
  };

  const getPaymentsByStatus = (status: string) => {
    return payments.filter((payment: Payment) => {
      if (status === 'vencido') {
        return payment.status !== 'pago' && isOverdue(payment.dataVencimento, payment.status);
      }
      return payment.status === status;
    });
  };

  const statsData = {
    total: payments.length,
    pagos: getPaymentsByStatus('pago').length,
    pendentes: getPaymentsByStatus('pendente').length,
    vencidos: getPaymentsByStatus('vencido').length,
    valorTotal: payments.reduce((sum: number, p: Payment) => sum + p.valor, 0),
    valorPago: getPaymentsByStatus('pago').reduce((sum: number, p: Payment) => sum + p.valor, 0),
    valorPendente: [...getPaymentsByStatus('pendente'), ...getPaymentsByStatus('vencido')].reduce((sum: number, p: Payment) => sum + p.valor, 0)
  };

  const handleDownloadBoleto = (payment: Payment) => {
    if (payment.urlBoleto) {
      window.open(payment.urlBoleto, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Pagamentos</h1>
          <p className="text-gray-600">Visualize o histórico de pagamentos, boletos e mensalidades</p>
        </div>
        {currentUser && (
          <Button onClick={handleRefreshAsaas} disabled={loadingAsaasPayments || loadingStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        )}
      </div>

      {/* Status de Inadimplência do Asaas */}
      {currentUser && (
        <>
          {loadingStatus ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          ) : paymentStatus ? (
            <Card className={paymentStatus.hasOverduePayments ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {paymentStatus.hasOverduePayments ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  Status Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentStatus.hasOverduePayments ? (
                  <div className="space-y-3">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Atenção:</strong> Você possui {paymentStatus.overdueCount} pagamento(s) em atraso 
                        no valor total de {formatCurrencyAsaas(paymentStatus.totalPendingAmount)}. 
                        Regularize sua situação para manter o acesso aos serviços.
                      </AlertDescription>
                    </Alert>
                    
                    {paymentStatus.overduePayments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Pagamentos em atraso:</h4>
                        {paymentStatus.overduePayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                            <div>
                              <p className="font-medium">{payment.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Vencimento: {formatDateAsaas(payment.dueDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">{formatCurrencyAsaas(payment.amount)}</p>
                              {payment.paymentUrl && (
                                <Button asChild size="sm" variant="outline" className="mt-1">
                                  <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Pagar
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-700">
                    <p className="font-medium">✅ Situação regular</p>
                    <p className="text-sm">Não há pagamentos em atraso. Você pode acessar todos os serviços normalmente.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      {/* Estatísticas do Sistema Interno */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(statsData.valorPago)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(statsData.valorPendente)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{statsData.vencidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de pagamentos */}
      <Tabs defaultValue="sistema" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sistema">Pagamentos do Sistema ({statsData.total})</TabsTrigger>
          <TabsTrigger value="asaas">Gateway de Pagamento ({asaasPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sistema" className="space-y-4">
          <Tabs defaultValue="todos" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todos">Todos ({statsData.total})</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes ({statsData.pendentes})</TabsTrigger>
              <TabsTrigger value="pago">Pagos ({statsData.pagos})</TabsTrigger>
              <TabsTrigger value="vencido">Vencidos ({statsData.vencidos})</TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="space-y-4">
              <PaymentList payments={payments} />
            </TabsContent>

            <TabsContent value="pendente" className="space-y-4">
              <PaymentList payments={getPaymentsByStatus('pendente')} />
            </TabsContent>

            <TabsContent value="pago" className="space-y-4">
              <PaymentList payments={getPaymentsByStatus('pago')} />
            </TabsContent>

            <TabsContent value="vencido" className="space-y-4">
              <PaymentList payments={getPaymentsByStatus('vencido')} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="asaas" className="space-y-4">
          <AsaasPaymentsList asaasPayments={asaasPayments} loading={loadingAsaasPayments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentList({ payments }: { payments: Payment[] }) {
  const getStatusBadge = (status: string) => {
    const variants = {
      'pago': { variant: 'default' as const, label: 'Pago', icon: CheckCircle },
      'pendente': { variant: 'secondary' as const, label: 'Pendente', icon: Clock },
      'vencido': { variant: 'destructive' as const, label: 'Vencido', icon: AlertCircle },
      'cancelado': { variant: 'outline' as const, label: 'Cancelado', icon: AlertCircle }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, icon: AlertCircle };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const isOverdue = (vencimento: string, status: string) => {
    if (status === 'pago') return false;
    return new Date(vencimento) < new Date();
  };

  const handleDownloadBoleto = (payment: Payment) => {
    if (payment.urlBoleto) {
      window.open(payment.urlBoleto, '_blank');
    }
  };

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
          <p className="text-gray-500 text-center">
            Não há pagamentos nesta categoria no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment: Payment) => {
        const statusInfo = getStatusBadge(
          isOverdue(payment.dataVencimento, payment.status) ? 'vencido' : payment.status
        );
        const StatusIcon = statusInfo.icon;
        
        return (
          <Card key={payment.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{payment.descricao}</CardTitle>
                  <CardDescription className="mt-1">
                    {payment.enrollment.course.nome} • {payment.enrollment.course.modalidade}
                  </CardDescription>
                </div>
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações do pagamento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <p className="font-bold text-lg">{formatCurrency(payment.valor)}</p>
                </div>
                
                <div>
                  <span className="text-gray-600">Vencimento:</span>
                  <p className="font-medium">
                    {new Date(payment.dataVencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                {payment.dataPagamento && (
                  <div>
                    <span className="text-gray-600">Data do pagamento:</span>
                    <p className="font-medium">
                      {new Date(payment.dataPagamento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                
                {payment.metodoPagamento && (
                  <div>
                    <span className="text-gray-600">Método:</span>
                    <p className="font-medium capitalize">
                      {payment.metodoPagamento.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>

              {payment.referencia && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">Referência:</p>
                  <p className="text-sm font-mono text-gray-600">{payment.referencia}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                {payment.status !== 'pago' && payment.urlBoleto && (
                  <Button 
                    size="sm" 
                    onClick={() => handleDownloadBoleto(payment)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Boleto
                  </Button>
                )}
                
                {payment.isRecorrente && (
                  <Badge variant="outline" className="text-xs">
                    Recorrente
                  </Badge>
                )}
              </div>

              {isOverdue(payment.dataVencimento, payment.status) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">
                      Pagamento em atraso - Entre em contato com o financeiro
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AsaasPaymentsList({ asaasPayments, loading }: { asaasPayments: AsaasPayment[]; loading: boolean }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (payment: AsaasPayment) => {
    return payment.status === 'overdue' || 
           (payment.status === 'pending' && new Date(payment.dueDate) < new Date());
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'received': { 
        label: 'Pago', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2 
      },
      'confirmed': { 
        label: 'Confirmado', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2 
      },
      'pending': { 
        label: 'Pendente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock 
      },
      'overdue': { 
        label: 'Vencido', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle 
      },
      'refunded': { 
        label: 'Estornado', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: RefreshCw 
      }
    };

    const variant = variants[status as keyof typeof variants] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock 
    };
    
    const IconComponent = variant.icon;
    
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'pix': 'PIX',
      'boleto': 'Boleto',
      'credit_card': 'Cartão de Crédito'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (asaasPayments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</h3>
        <p className="text-muted-foreground">
          Você ainda não possui cobranças registradas no gateway de pagamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {asaasPayments.map((payment) => (
        <div 
          key={payment.id} 
          className={`border rounded-lg p-4 ${isOverdue(payment) ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <div>
                <h3 className="font-medium">{payment.description}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {payment.id} • {getPaymentMethodLabel(payment.paymentMethod)}
                </p>
              </div>
            </div>
            {getStatusBadge(payment.status)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <span className="text-muted-foreground">Vencimento:</span>
                <p className={isOverdue(payment) ? 'text-red-600 font-medium' : ''}>
                  {formatDate(payment.dueDate)}
                </p>
              </div>
            </div>
            
            <div>
              <span className="text-muted-foreground">Criado em:</span>
              <p>{formatDate(payment.createdAt)}</p>
            </div>
            
            <div className="flex justify-end">
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
          
          {payment.paidAt && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-green-600">
                ✅ Pago em {formatDate(payment.paidAt)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}