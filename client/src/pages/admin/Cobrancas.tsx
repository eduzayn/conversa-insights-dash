import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, RotateCcw, Plus, Eye, Copy, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface AsaasPayment {
  id: string;
  asaasPaymentId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  description: string;
  value: number;
  dueDate: string;
  status: string;
  billingType: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface CacheMetrics {
  totalPayments: number;
  totalValue: number;
  receivedValue: number;
  pendingValue: number;
  overdueValue: number;
  receivedPayments: number;
  uniqueCustomers: number;
}

export default function Cobrancas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  const queryClient = useQueryClient();

  // Query para buscar cobranças do cache
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/asaas/cache/payments", statusFilter, searchTerm, currentPage],
    queryFn: () => apiRequest(`/api/admin/asaas/cache/payments?status=${statusFilter === 'all' ? '' : statusFilter}&customerName=${searchTerm}&limit=${pageSize}&offset=${(currentPage - 1) * pageSize}`),
  });

  // Query para métricas
  const { data: metrics } = useQuery<CacheMetrics>({
    queryKey: ["/api/admin/asaas/cache/metrics"],
    queryFn: () => apiRequest("/api/admin/asaas/cache/metrics"),
  });

  // Mutation para sincronização
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/asaas/cache/sync", {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/asaas/cache/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/asaas/cache/metrics"] });
    },
  });

  const payments = paymentsData?.payments || [];
  const totalPayments = paymentsData?.total || 0;

  // Função para criar nova cobrança
  const handleNewPayment = () => {
    // Redirecionar para página de integração Asaas ou abrir modal
    window.location.href = '/integracao-asaas';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      received: { label: "Recebido", variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
      overdue: { label: "Vencido", variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
      confirmed: { label: "Confirmado", variant: "default", className: "bg-blue-100 text-blue-800 border-blue-200" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: "outline" as const, 
      className: "bg-gray-100 text-gray-800 border-gray-200" 
    };
    
    return (
      <Badge 
        variant={config.variant}
        className={cn("font-medium", config.className)}
      >
        {config.label}
      </Badge>
    );
  };

  const getMethodBadge = (billingType: string) => {
    const methodMap = {
      BOLETO: "Boleto",
      PIX: "PIX",
      CREDIT_CARD: "Cartão",
      DEBIT_CARD: "Débito",
      BANK_SLIP: "Boleto",
    };
    
    return methodMap[billingType as keyof typeof methodMap] || billingType;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cobranças</h1>
              <p className="text-gray-600">Gerencie todas as cobranças de seus alunos.</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center space-x-2"
            >
              <RotateCcw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
              <span>Sincronizar com Asaas</span>
            </Button>
            <Button 
              onClick={handleNewPayment}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Nova cobrança</span>
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de cobranças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {totalPayments || metrics?.totalPayments || 382}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valores pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics?.receivedValue || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valores pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(metrics?.pendingValue || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vencidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(metrics?.overdueValue || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por aluno ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                {totalPayments} Ações em lote ▼
              </div>
              <Button 
                variant="outline" 
                onClick={handleNewPayment}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar cobrança</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Cobranças */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16 text-gray-600 font-medium">ID</TableHead>
                  <TableHead className="text-gray-600 font-medium">Aluno</TableHead>
                  <TableHead className="text-gray-600 font-medium">Descrição</TableHead>
                  <TableHead className="text-gray-600 font-medium">Valor</TableHead>
                  <TableHead className="text-gray-600 font-medium">Vencimento</TableHead>
                  <TableHead className="text-gray-600 font-medium">Status</TableHead>
                  <TableHead className="text-gray-600 font-medium">Método</TableHead>
                  <TableHead className="text-gray-600 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhuma cobrança encontrada. Sincronize com o Asaas para importar dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment: AsaasPayment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-blue-600">
                        {payment.asaasPaymentId?.slice(-6) || payment.id.slice(-6)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {payment.customerName?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{payment.customerName}</div>
                            <div className="text-sm text-gray-500">{payment.customerCpf}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-gray-900">{payment.description}</div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {formatCurrency(payment.value)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {formatDate(payment.dueDate)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {getMethodBadge(payment.billingType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                            <Copy className="h-4 w-4" />
                          </Button>
                          {payment.billingType === 'BOLETO' && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPayments > pageSize && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Página {currentPage} de {Math.ceil(totalPayments / pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === Math.ceil(totalPayments / pageSize)}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}