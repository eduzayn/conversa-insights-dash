import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Eye, Copy, FileText, Link as LinkIcon, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { Link } from 'react-router-dom';
import { apiRequest } from "@/lib/queryClient";

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  description: string;
  billingType: string;
  dueDate: string;
  status: string;
  customerData?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    phone?: string;
    mobilePhone?: string;
  };
}

export default function Cobrancas() {
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar dados reais das cobranças do Asaas (DESABILITADA para não consumir cota automaticamente)
  const { data: paymentsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/asaas/payments'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/asaas/payments');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: false // Desabilita execução automática - só executa quando clicar em "Sincronizar"
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Usar apenas dados reais da API do Asaas
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const filteredPayments = payments.filter((payment: AsaasPayment) => {
    const customerName = payment.customerData?.name || payment.customer || '';
    const customerEmail = payment.customerData?.email || '';
    const matchesSearch = searchTerm === '' || 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.includes(searchTerm);
    return matchesSearch;
  });

  // Calcular estatísticas
  const stats = {
    total: payments.length,
    totalValue: payments.reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
    pendingValue: payments.filter((p: AsaasPayment) => p.status === 'PENDING').reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0),
    overdueValue: payments.filter((p: AsaasPayment) => p.status === 'OVERDUE').reduce((sum: number, p: AsaasPayment) => sum + (p.value || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header idêntico à imagem */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cobranças</h1>
          <p className="text-gray-600">Gerencie todas as cobranças de seus alunos.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            className="text-blue-600 border-blue-600"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar com Asaas
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova cobrança
          </Button>
        </div>
      </div>

      {/* Erro de API - quando há problemas com Asaas */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message?.includes('429') || error.message?.includes('cota') ? 
              'Cota de requisições da API Asaas esgotada. Aguarde alguns minutos e tente novamente.' :
              `Erro ao conectar com a API do Asaas. Verifique suas credenciais e tente novamente. ${error.message ? `(${error.message})` : ''}`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Aviso sobre uso de dados reais */}
      {!error && !isLoading && Array.isArray(paymentsData) && paymentsData.length === 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Clique em "Sincronizar com Asaas" para carregar as cobranças reais da sua conta. 
            O sistema usa exclusivamente dados reais da API do Asaas.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de estatísticas idênticos à imagem */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border">
          <div className="text-sm text-gray-600 mb-1">Total de cobranças</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <div className="text-sm text-gray-600 mb-1">Valores pagos</div>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(0)}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <div className="text-sm text-gray-600 mb-1">Valores pendentes</div>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(stats.pendingValue)}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <div className="text-sm text-gray-600 mb-1">Vencidos</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.overdueValue)}</div>
        </div>
      </div>

      {/* Tabela principal - idêntica à imagem */}
      <div className="bg-white rounded-lg border">
        {/* Header da tabela */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por aluno ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">1 Ações em lote ▼</span>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar cobrança
            </Button>
          </div>
        </div>

        {/* Tabela */}
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Carregando cobranças...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhuma cobrança encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment: AsaasPayment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{payment.id.slice(-3)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {(payment.customerData?.name || payment.customer || 'Cliente')?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {payment.customerData?.name || payment.customer || 'Cliente'}
                        </div>
                        {payment.customerData?.email && (
                          <div className="text-xs text-gray-500">
                            {payment.customerData.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(payment.value)}</TableCell>
                  <TableCell>{formatDate(payment.dueDate)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                      payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status === 'PENDING' ? 'Pendente' :
                       payment.status === 'RECEIVED' ? 'Recebido' :
                       payment.status === 'OVERDUE' ? 'Vencido' : payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {payment.billingType === 'PIX' ? 'Pix' : 
                       payment.billingType === 'BOLETO' ? 'Boleto' : 
                       payment.billingType === 'CREDIT_CARD' ? 'Cartão' : payment.billingType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600">
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

        {/* Footer da tabela */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredPayments.length} cobranças no valor total de{' '}
              <span className="font-semibold">
                {formatCurrency(filteredPayments.reduce((sum, p: AsaasPayment) => sum + (p.value || 0), 0))}
              </span>{' '}
              das {stats.total} cobranças existentes
            </div>
            <div className="flex items-center gap-2">
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
  );
}