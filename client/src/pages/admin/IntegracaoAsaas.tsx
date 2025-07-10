import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  RefreshCw, 
  Eye,
  ArrowLeft,
  AlertCircle,
  BarChart3
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
  dateCreated: string;
  paymentDate?: string;
}

interface Payment {
  id: number;
  userId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  description: string;
  dueDate: string;
  paymentUrl?: string;
  createdAt: string;
}

export default function IntegracaoAsaas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para controle da interface
  const [testWebhookData, setTestWebhookData] = useState('');

  // Query para status da conexão (DESABILITADA para não consumir cota automaticamente)
  const { data: connectionStatus, refetch: refetchConnection } = useQuery({
    queryKey: ['/api/admin/asaas/status'],
    queryFn: () => apiRequest('/api/admin/asaas/status'),
    enabled: false, // Desabilita execução automática
  });

  // Query para estatísticas
  const { data: statsData } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: () => apiRequest('/api/payments'),
  });

  // Mutation para testar conexão
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/asaas/status', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: data.success ? "Conexão bem-sucedida" : "Falha na conexão",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      refetchConnection();
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para testes de webhook
  const testWebhookMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/test-webhook', { 
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Webhook testado",
        description: "Teste enviado com sucesso"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no webhook",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Integração Asaas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie pagamentos e cobranças através do gateway Asaas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => refetchConnection()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar com Asaas
          </Button>
          <Button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="flex items-center gap-2"
          >
            {testConnectionMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Testar Conexão
          </Button>
          <Link to="/cobrancas">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Eye className="h-4 w-4" />
              Ver todas as cobranças
            </Button>
          </Link>
        </div>
      </div>

      {/* Status da Integração */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status da Integração
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {connectionStatus?.success ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Conectado com sucesso ao Asaas
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não testado - Configure sua chave de API do Asaas
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs de Configuração */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Criar Cobrança</TabsTrigger>
          <TabsTrigger value="enrollments">Teste Matrícula</TabsTrigger>
          <TabsTrigger value="webhooks">Teste Webhook</TabsTrigger>
        </TabsList>

        {/* Outras tabs podem ser implementadas aqui */}
        <TabsContent value="create">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Funcionalidade de criar cobrança em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Funcionalidade de teste de matrícula em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Funcionalidade de teste de webhook em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}