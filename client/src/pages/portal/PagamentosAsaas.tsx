import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  RefreshCw,
  DollarSign,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

export default function PagamentosAsaas() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Recuperar usuário logado do localStorage
    const userData = localStorage.getItem('student');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Query para buscar pagamentos do usuário
  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['/api/payments', currentUser?.id],
    queryFn: () => apiRequest(`/api/payments?userId=${currentUser?.id}`) as Promise<Payment[]>,
    enabled: !!currentUser?.id,
    staleTime: 60000
  });

  // Query para verificar status de inadimplência
  const { data: paymentStatus, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/users', currentUser?.id, 'payment-status'],
    queryFn: () => apiRequest(`/api/users/${currentUser?.id}/payment-status`) as Promise<PaymentStatusResponse>,
    enabled: !!currentUser?.id,
    staleTime: 30000
  });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (payment: Payment) => {
    return payment.status === 'overdue' || 
           (payment.status === 'pending' && new Date(payment.dueDate) < new Date());
  };

  const handleRefresh = () => {
    refetchPayments();
    refetchStatus();
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Você precisa estar logado para visualizar seus pagamentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Pagamentos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie suas cobranças e pagamentos
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loadingPayments || loadingStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status de Inadimplência */}
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
              Status do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentStatus.hasOverduePayments ? (
              <div className="space-y-3">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Você possui {paymentStatus.overdueCount} pagamento(s) em atraso 
                    no valor total de {formatCurrency(paymentStatus.totalPendingAmount)}. 
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
                            Vencimento: {formatDate(payment.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">{formatCurrency(payment.amount)}</p>
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

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>
            Todos os seus pagamentos e cobranças
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-muted-foreground">
                Você ainda não possui cobranças registradas no sistema.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}