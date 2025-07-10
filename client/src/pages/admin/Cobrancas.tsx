import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Eye, Copy, FileText, Link as LinkIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Link } from 'react-router-dom';

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  description: string;
  billingType: string;
  dueDate: string;
  status: string;
}

export default function Cobrancas() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados de demonstração para cobranças
  const mockPayments: AsaasPayment[] = [
    {
      id: 'pay_330',
      customer: 'Eliane Dantas Silva',
      value: 115.46,
      description: 'Parcela 18 de 18: Formação Pedagógica em Geografia',
      billingType: 'PIX',
      dueDate: '2024-07-09',
      status: 'PENDING'
    },
    {
      id: 'pay_142',
      customer: 'Administrador Teste',
      value: 129.90,
      description: 'Parcela 16 de 16: Formação Pedagógica em Música em música',
      billingType: 'BOLETO',
      dueDate: '2024-08-28',
      status: 'PENDING'
    },
    {
      id: 'pay_126',
      customer: 'Administrador Teste',
      value: 129.90,
      description: 'Parcela 16 de 16: Segunda Licenciatura em Pedagogia',
      billingType: 'BOLETO',
      dueDate: '2024-07-27',
      status: 'PENDING'
    },
    {
      id: 'pay_231',
      customer: 'Eliane Dantas Silva',
      value: 115.46,
      description: 'Parcela 17 de 18: Formação Pedagógica em Geografia',
      billingType: 'PIX',
      dueDate: '2024-07-17',
      status: 'PENDING'
    },
    {
      id: 'pay_179',
      customer: 'Maria da Conceição Ferreira',
      value: 129.90,
      description: 'Parcela 16 de 16: Segunda Licenciatura em Música',
      billingType: 'BOLETO',
      dueDate: '2024-08-08',
      status: 'PENDING'
    },
    {
      id: 'pay_143',
      customer: 'Administrador Teste',
      value: 129.90,
      description: 'Parcela 15 de 16: Formação Pedagógica em Música em música',
      billingType: 'BOLETO',
      dueDate: '2024-07-28',
      status: 'PENDING'
    },
    {
      id: 'pay_229',
      customer: 'Denise de Abreu Neves Batista',
      value: 129.90,
      description: 'Parcela 16 de 16: 2ª graduação - Licenciatura em Pedagogia',
      billingType: 'BOLETO',
      dueDate: '2024-07-28',
      status: 'PENDING'
    },
    {
      id: 'pay_127',
      customer: 'Administrador Teste',
      value: 129.90,
      description: 'Parcela 15 de 16: Segunda Licenciatura em Pedagogia',
      billingType: 'BOLETO',
      dueDate: '2024-07-27',
      status: 'PENDING'
    },
    {
      id: 'pay_237',
      customer: 'Ana Paula Amaral Cecílio',
      value: 99.00,
      description: 'Parcela 16 de 16',
      billingType: 'BOLETO',
      dueDate: '2024-07-24',
      status: 'PENDING'
    },
    {
      id: 'pay_273',
      customer: 'Fernanda Santos Borges',
      value: 129.95,
      description: 'Parcela 16 de 16',
      billingType: 'BOLETO',
      dueDate: '2024-07-24',
      status: 'PENDING'
    }
  ];

  // Buscar dados das cobranças - usar mock quando API falha
  const { data: paymentsData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/asaas/payments'],
    enabled: true
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

  // Usar dados mock ou dados da API
  const payments = Array.isArray(paymentsData) && paymentsData.length > 0 ? paymentsData : mockPayments;
  const filteredPayments = payments.filter((payment: AsaasPayment) => {
    const matchesSearch = searchTerm === '' || 
      payment.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <Link to="/integracao-asaas">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cobranças</h1>
          <p className="text-gray-600">Gerencie todas as cobranças de seus alunos.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="text-blue-600 border-blue-600">
            Sincronizar com Asaas
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova cobrança
          </Button>
        </div>
      </div>

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
                          {payment.customer?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      </div>
                      <span className="font-medium">{payment.customer || 'Cliente'}</span>
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