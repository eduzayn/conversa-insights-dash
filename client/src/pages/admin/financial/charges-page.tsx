import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  Check,
  CreditCard,
  FileText,
  Plus,
  Search,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Filter,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  Settings,
  Mail,
  MessageSquare,
  X,
  Edit,
  Copy,
  Files,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Interfaces para tipagem do TypeScript
interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  customerData?: {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
  };
  billingType: string;
  value: number;
  netValue: number;
  description: string;
  installment?: string;
  dueDate: string;
  status: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  paymentDate?: string;
}

interface AsaasStats {
  total: { count: number; value: number };
  pending: { count: number; value: number };
  confirmed: { count: number; value: number };
  overdue: { count: number; value: number };
  thisMonth: { count: number; value: number };
  lastMonth: { count: number; value: number };
  byBillingType: Record<string, { count: number; value: number }>;
}

interface SyncStatus {
  isActive: boolean;
  lastSync: string | null;
  totalLocalPayments: number;
  syncedPayments: number;
  syncFrequency: string;
  nextSync: string;
}

const ChargesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para filtros e paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [billingTypeFilter, setBillingTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Query para buscar cobranças do Asaas
  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: [
      "/api/asaas/payments",
      currentPage,
      statusFilter,
      billingTypeFilter,
      searchTerm,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(billingTypeFilter &&
          billingTypeFilter !== "all" && { billingType: billingTypeFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/asaas/payments?${params}`, {
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar cobranças");
      }

      return response.json();
    },
  });

  // Query para estatísticas
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/asaas/payments/stats"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/asaas/payments/stats", {
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas");
      }

      return response.json();
    },
  });

  // Query para status de sincronização
  const { data: syncStatus, isLoading: isLoadingSyncStatus } = useQuery({
    queryKey: ["/api/asaas/sync/status"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/asaas/sync/status", {
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar status de sincronização");
      }

      return response.json();
    },
  });

  // Mutation para importar cobranças
  const importPaymentsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/asaas/payments/import", {
        method: "POST",
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Erro na importação");
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Importação concluída",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/payments"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/asaas/payments/stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/sync/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para sincronizar cobranças
  const syncPaymentsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/asaas/payments/sync", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro na sincronização");
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Sincronização concluída",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/payments"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/asaas/payments/stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/sync/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para sincronização COMPLETA
  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/asaas/payments/full-sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro na sincronização completa');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🔄 Sincronização Completa Realizada",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/payments/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asaas/sync/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro na sincronização completa",
        variant: "destructive",
      });
    },
  });

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "RECEIVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Função para obter a cor do tipo de cobrança
  const getBillingTypeColor = (type: string) => {
    switch (type) {
      case "CREDIT_CARD":
        return "bg-purple-100 text-purple-800";
      case "PIX":
        return "bg-green-100 text-green-800";
      case "BOLETO":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      RECEIVED: "Recebido",
      OVERDUE: "Vencido",
      CANCELLED: "Cancelado",
    };
    return statusMap[status] || status;
  };

  // Função para obter o texto do tipo de cobrança
  const getBillingTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      CREDIT_CARD: "Cartão de Crédito",
      PIX: "PIX",
      BOLETO: "Boleto",
      DEBIT_CARD: "Cartão de Débito",
    };
    return typeMap[type] || type;
  };

  // Função para visualizar detalhes da cobrança
  const handleViewDetails = async (payment: AsaasPayment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/asaas/payments/${payment.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedPayment(result.payment);
        setShowDetailsModal(true);
      } else {
        throw new Error("Erro ao carregar detalhes da cobrança");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes da cobrança",
        variant: "destructive",
      });
    }
  };

  // Função para cancelar cobrança
  const handleCancelCharge = async (paymentId: string) => {
    try {
      if (!confirm("Tem certeza que deseja cancelar esta cobrança?")) {
        return;
      }

      const response = await fetch(`/api/asaas/payments/${paymentId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cobrança cancelada com sucesso!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/asaas/payments"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/asaas/payments/stats"],
        });
      } else {
        throw new Error("Erro ao cancelar cobrança");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar cobrança",
        variant: "destructive",
      });
    }
  };

  // Função para enviar lembrete
  const handleSendReminder = async (paymentId: string) => {
    try {
      const reminderType = prompt(
        "Tipo de lembrete:\n1 - Email\n2 - SMS\n3 - Ambos\n\nDigite o número:",
      );

      let type = "email";
      if (reminderType === "2") type = "sms";
      if (reminderType === "3") type = "both";

      const response = await fetch(
        `/api/asaas/payments/${paymentId}/reminder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ type }),
        },
      );

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Lembrete enviado com sucesso!",
        });
      } else {
        throw new Error("Erro ao enviar lembrete");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar lembrete",
        variant: "destructive",
      });
    }
  };

  // Função para gerar relatório financeiro
  const handleGenerateReport = async () => {
    try {
      const startDate = prompt("Data de início (YYYY-MM-DD):");
      const endDate = prompt("Data de fim (YYYY-MM-DD):");

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/asaas/reports/financial?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const report = await response.json();

        // Criar e baixar arquivo
        const blob = new Blob([JSON.stringify(report, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Sucesso",
          description: "Relatório gerado e baixado com sucesso!",
        });
      } else {
        throw new Error("Erro ao gerar relatório");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive",
      });
    }
  };

  // Função para configurar notificações automáticas
  const handleConfigureNotifications = async () => {
    try {
      const emailEnabled = confirm("Habilitar notificações por email?");
      const smsEnabled = confirm("Habilitar notificações por SMS?");
      const reminderDaysBefore = parseInt(
        prompt("Quantos dias antes do vencimento enviar lembrete?") || "3",
      );
      const overdueReminderDays = parseInt(
        prompt("Quantos dias após vencimento enviar lembrete?") || "7",
      );

      const response = await fetch("/api/asaas/notifications/configure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          emailEnabled,
          smsEnabled,
          reminderDaysBefore,
          overdueReminderDays,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações de notificação atualizadas com sucesso!",
        });
      } else {
        throw new Error("Erro ao configurar notificações");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao configurar notificações",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento Asaas
          </h1>
          <p className="text-muted-foreground">
            Interface completa para gerenciar cobranças do Asaas com
            sincronização automática
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetchPayments()}
            variant="outline"
            size="sm"
            disabled={isLoadingPayments}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoadingPayments ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            onClick={() => importPaymentsMutation.mutate()}
            size="sm"
            disabled={
              importPaymentsMutation.isPending || syncPaymentsMutation.isPending
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {importPaymentsMutation.isPending ||
            syncPaymentsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar com Asaas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Cobranças</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Cobranças
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : stats?.total?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats
                    ? "..."
                    : formatCurrency(stats?.total?.value || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : stats?.pending?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats
                    ? "..."
                    : formatCurrency(stats?.pending?.value || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Confirmadas
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : stats?.confirmed?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats
                    ? "..."
                    : formatCurrency(stats?.confirmed?.value || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? "..." : stats?.overdue?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats
                    ? "..."
                    : formatCurrency(stats?.overdue?.value || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de tipos de cobrança */}
          {stats?.byBillingType && (
            <Card>
              <CardHeader>
                <CardTitle>Cobranças por Tipo</CardTitle>
                <CardDescription>
                  Distribuição dos tipos de cobrança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byBillingType).map(([type, data]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={getBillingTypeColor(type)}
                        >
                          {getBillingTypeText(type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {data.count} cobranças
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(data.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments">
          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                    <SelectItem value="RECEIVED">Recebido</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={billingTypeFilter}
                  onValueChange={setBillingTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="CREDIT_CARD">
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="Data início"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="Data fim"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de cobranças */}
          <Card>
            <CardHeader>
              <CardTitle>Cobranças do Asaas</CardTitle>
              <CardDescription>
                Todas as cobranças sincronizadas do sistema Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsData?.payments?.map((payment: AsaasPayment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">
                            {String(payment.id).slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {payment.customerData?.name ||
                                  "Cliente não encontrado"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {payment.customerData?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {payment.description}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {formatCurrency(payment.value)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Líquido: {formatCurrency(payment.netValue)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(payment.dueDate)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(payment.status)}
                            >
                              {getStatusText(payment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getBillingTypeColor(
                                payment.billingType,
                              )}
                            >
                              {getBillingTypeText(payment.billingType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {/* Visualizar cobrança */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    payment.invoiceUrl || "#",
                                    "_blank",
                                  )
                                }
                                title="Visualizar cobrança"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Editar cobrança */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(payment)}
                                title="Ver/Editar cobrança"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>

                              {/* Copiar link */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (payment.invoiceUrl) {
                                    navigator.clipboard.writeText(
                                      payment.invoiceUrl,
                                    );
                                    toast({ title: "Link copiado!" });
                                  }
                                }}
                                title="Copiar link"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>

                              {/* Duplicar cobrança */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  console.log("Duplicar cobrança", payment.id)
                                }
                                title="Duplicar cobrança"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800"
                              >
                                <Files className="w-4 h-4" />
                              </Button>

                              {/* Enviar lembrete */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendReminder(payment.id)}
                                disabled={
                                  payment.status === "CONFIRMED" ||
                                  payment.status === "CANCELLED"
                                }
                                title="Enviar lembrete"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 disabled:text-gray-400"
                              >
                                <Send className="w-4 h-4" />
                              </Button>

                              {/* Cancelar cobrança */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelCharge(payment.id)}
                                disabled={payment.status === "CANCELLED"}
                                title="Cancelar cobrança"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 disabled:text-gray-400"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {paymentsData?.pagination && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} até{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          paymentsData.pagination.total,
                        )}{" "}
                        de {paymentsData.pagination.total} resultados
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!paymentsData?.hasMore}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          {/* Nova aba: Relatórios */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Gere relatórios detalhados das cobranças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  onClick={() => handleGenerateReport()}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Relatório Geral
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConfigureNotifications()}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Notificações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status da Sincronização</CardTitle>
              <CardDescription>
                Monitoramento da sincronização automática com o Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSyncStatus ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Status da Sincronização
                      </label>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${syncStatus?.isActive ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span>
                          {syncStatus?.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Última Sincronização
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {syncStatus?.lastSync
                          ? formatDate(syncStatus.lastSync)
                          : "Nunca"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Cobranças Locais
                      </label>
                      <p className="text-2xl font-bold">
                        {syncStatus?.totalLocalPayments || 0}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Sincronizadas
                      </label>
                      <p className="text-2xl font-bold">
                        {syncStatus?.syncedPayments || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Frequência de Sincronização
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus?.syncFrequency || "Não configurada"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Próxima Sincronização
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus?.nextSync || "Não agendada"}
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => syncPaymentsMutation.mutate()}
                      disabled={syncPaymentsMutation.isPending}
                      variant="outline"
                    >
                      <RotateCcw
                        className={`w-4 h-4 mr-2 ${syncPaymentsMutation.isPending ? "animate-spin" : ""}`}
                      />
                      Sincronizar Parcial
                    </Button>
                    <Button
                      onClick={() => fullSyncMutation.mutate()}
                      disabled={fullSyncMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download
                        className={`w-4 h-4 mr-2 ${fullSyncMutation.isPending ? "animate-spin" : ""}`}
                      />
                      🔄 SINCRONIZAÇÃO COMPLETA
                    </Button>
                    <Button
                      onClick={() => importPaymentsMutation.mutate()}
                      variant="outline"
                      disabled={importPaymentsMutation.isPending}
                    >
                      <Download
                        className={`w-4 h-4 mr-2 ${importPaymentsMutation.isPending ? "animate-spin" : ""}`}
                      />
                      Importação Limitada
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Cobrança */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Cobrança</DialogTitle>
            <DialogDescription>
              Visualize e gerencie os detalhes completos da cobrança
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID da Cobrança</label>
                  <p className="text-sm bg-gray-100 p-2 rounded font-mono">
                    {selectedPayment.id}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(selectedPayment.status)}
                  >
                    {getStatusText(selectedPayment.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor</label>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedPayment.value)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Líquido</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedPayment.netValue)}
                  </p>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Dados do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <p className="text-sm">{selectedPayment.customerName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm">{selectedPayment.customerEmail || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CPF/CNPJ</label>
                    <p className="text-sm">{selectedPayment.customerCpfCnpj || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <p className="text-sm">{selectedPayment.customerPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Detalhes da Cobrança */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Detalhes da Cobrança</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <p className="text-sm">{selectedPayment.description || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Cobrança</label>
                    <Badge variant="outline" className={getBillingTypeColor(selectedPayment.billingType)}>
                      {getBillingTypeText(selectedPayment.billingType)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data de Vencimento</label>
                    <p className="text-sm">{formatDate(selectedPayment.dueDate)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data de Criação</label>
                    <p className="text-sm">{formatDate(selectedPayment.dateCreated)}</p>
                  </div>
                </div>
              </div>

              {/* Links e Ações */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Links e Ações</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPayment.invoiceUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedPayment.invoiceUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Fatura
                    </Button>
                  )}
                  {selectedPayment.invoiceUrl && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPayment.invoiceUrl);
                        toast({ title: "Link copiado!" });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                  )}
                  {selectedPayment.status !== 'CONFIRMED' && selectedPayment.status !== 'CANCELLED' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleSendReminder(selectedPayment.id)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Lembrete
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleCancelCharge(selectedPayment.id);
                          setShowDetailsModal(false);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar Cobrança
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChargesPage;
