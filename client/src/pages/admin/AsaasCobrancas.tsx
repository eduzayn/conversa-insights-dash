import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  RotateCcw,
  Plus,
  Search,
  Eye,
  Copy,
  FileText,
  Link as LinkIcon,
  RefreshCw,
  X,
  ChevronDown
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
  bankSlipUrl?: string;
  dateCreated: string;
  paymentDate?: string;
}

export default function AsaasCobrancas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Query para buscar todas as cobranças do Asaas
  const { data: paymentsData = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/asaas/payments', { status: statusFilter }],
    queryFn: () => apiRequest('/api/admin/asaas/payments', {
      method: 'GET',
      searchParams: new URLSearchParams(
        statusFilter !== 'all' ? [['status', statusFilter]] : []
      )
    }),
  });

  // Mutation para sincronizar com Asaas
  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/payments/sync', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Sincronização concluída",
        description: "Cobranças sincronizadas com sucesso!"
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  // Cálculos de estatísticas
  const totalCobrancas = payments.length;
  const valoresPagos = payments
    .filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + p.value, 0);
  const valoresPendentes = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.value, 0);
  const vencidos = payments
    .filter(p => p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.value, 0);

  // Filtrar pagamentos por busca
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      payment.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pendente', color: 'bg-yellow-500 text-yellow-50' },
      'RECEIVED': { label: 'Recebido', color: 'bg-green-500 text-green-50' },
      'CONFIRMED': { label: 'Confirmado', color: 'bg-green-500 text-green-50' },
      'OVERDUE': { label: 'Vencido', color: 'bg-red-500 text-red-50' },
      'REFUNDED': { label: 'Estornado', color: 'bg-gray-500 text-gray-50' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <Badge className={`${config.color} text-xs px-2 py-1`}>
        {config.label}
      </Badge>
    );
  };

  const getBillingTypeIcon = (billingType: string) => {
    if (billingType === 'PIX') return 'P Pix';
    if (billingType === 'BOLETO') return '🏦 Boleto';
    if (billingType === 'CREDIT_CARD') return '💳 Cartão';
    return billingType;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/admin" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Cobranças</h1>
                <p className="text-sm text-gray-500">Gerencie todas as cobranças de seus alunos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Sincronizar com Asaas
              </Button>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Nova cobrança
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Total de cobranças</div>
            <div className="text-3xl font-bold text-gray-900">{totalCobrancas}</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Valores pagos</div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(valoresPagos)}</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Valores pendentes</div>
            <div className="text-3xl font-bold text-yellow-600">{formatCurrency(valoresPendentes)}</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Vencidos</div>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(vencidos)}</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por aluno ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="RECEIVED">Recebido</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                    <SelectItem value="REFUNDED">Estornado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabela de Cobranças */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Aluno</TableHead>
                  <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                  <TableHead className="font-semibold text-gray-700">Valor</TableHead>
                  <TableHead className="font-semibold text-gray-700">Vencimento</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Forma de pagamento</TableHead>
                  <TableHead className="font-semibold text-gray-700">Data de vencimento</TableHead>
                  <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando cobranças...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhuma cobrança encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{payment.id.slice(-3)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-medium">
                              {payment.customer?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <span className="font-medium">{payment.customer || 'Cliente'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(payment.value)}</TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{getBillingTypeIcon(payment.billingType)}</span>
                      </TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
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

          {/* Footer com paginação */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {filteredPayments.length} cobranças no valor total de{' '}
                <span className="font-semibold">
                  {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.value, 0))}
                </span>{' '}
                das {totalCobrancas} cobranças existentes
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
      </div>
    </div>
  );
}