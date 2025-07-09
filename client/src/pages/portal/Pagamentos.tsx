import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Download, ExternalLink, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";

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

export default function Pagamentos() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/pagamentos']
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'pago': { variant: 'default' as const, label: 'Pago', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
      'pendente': { variant: 'secondary' as const, label: 'Pendente', icon: Clock, color: 'text-yellow-700 bg-yellow-100' },
      'vencido': { variant: 'destructive' as const, label: 'Vencido', icon: AlertCircle, color: 'text-red-700 bg-red-100' },
      'cancelado': { variant: 'outline' as const, label: 'Cancelado', icon: AlertCircle, color: 'text-gray-700 bg-gray-100' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, icon: AlertCircle, color: 'text-gray-700 bg-gray-100' };
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-600">Visualize o histórico de pagamentos, boletos e mensalidades</p>
      </div>

      {/* Estatísticas */}
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