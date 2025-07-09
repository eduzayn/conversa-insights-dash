import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Settings, Phone, Mail, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export default function IntegracaoBotConversa() {
  const [testAccount, setTestAccount] = useState<'SUPORTE' | 'COMERCIAL'>('COMERCIAL');
  const [testPhone, setTestPhone] = useState('5511987654321');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookData, setWebhookData] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  // Configurações da conta comercial extraídas das imagens
  const comercialConfig = {
    customFields: [
      { name: 'AtendimentoOFF', type: 'Número', description: 'Nº de verificações quando atendimento está offline' },
      { name: 'DataHoraTime', type: 'Texto', description: 'Campo com recebe informações de data e hora' },
      { name: 'DataMomento', type: 'Data & Hora', description: 'Data e hora do momento' },
      { name: 'Frete', type: 'Número', description: 'Frete: Taxa de entrega' },
      { name: 'ProdutoEscolhido', type: 'Número', description: 'Campo para verificar produto escolhido' },
      { name: 'TotalConfirmado', type: 'Número', description: 'Total confirmado' },
      { name: 'usuarioInformado', type: 'Texto', description: 'Campo que salva a cidade' }
    ],
    tags: [
      'Aguardando dados', 'Aguardando pagamento', 'Comercial', 'Muito Interesse',
      'Matriculado', 'Pós Graduação', 'Primeira Graduação UNOPAR', 'Suporte'
    ],
    sequences: ['sequencia1'],
    webhooks: ['Controle de Atendimento Diário']
  };

  const handleTestIntegration = async () => {
    if (!testPhone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um telefone para teste",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/botconversa/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          account: testAccount,
          phone: testPhone
        })
      });

      const result = await response.json();
      
      setTestResult({
        success: result.success || response.ok,
        message: result.message || result.error || 'Teste realizado',
        data: result.subscriber || result
      });

      if (result.success) {
        toast({
          title: "Teste realizado com sucesso",
          description: result.message
        });
      } else {
        toast({
          title: "Erro no teste",
          description: result.message || result.error,
          variant: "destructive"
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setTestResult({
        success: false,
        message: `Erro na requisição: ${errorMessage}`
      });
      
      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/botconversa/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          account: testAccount
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sincronização concluída",
          description: result.message
        });
      } else {
        toast({
          title: "Erro na sincronização",
          description: result.message || result.error,
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira dados JSON para teste do webhook",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = JSON.parse(webhookData);
      
      const response = await fetch(`/webhook/botconversa/${testAccount.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Webhook testado com sucesso",
          description: result.message
        });
      } else {
        toast({
          title: "Erro no webhook",
          description: result.error || result.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      toast({
        title: "Erro no JSON",
        description: "Verifique se o JSON está válido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 min-h-[44px] px-2 md:px-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Integração BotConversa</h1>
      </div>

      {/* Status das Configurações */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Configurações Mapeadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Conta Comercial</Label>
              <div className="mt-2 space-y-2">
                <Badge variant="outline">
                  {comercialConfig.customFields.length} campos personalizados
                </Badge>
                <Badge variant="outline">
                  {comercialConfig.tags.length} etiquetas
                </Badge>
                <Badge variant="outline">
                  {comercialConfig.sequences.length} sequência ativa
                </Badge>
              </div>
            </div>
            
            <Separator />

            <div>
              <Label className="text-sm font-medium">Número do Bot Conectado</Label>
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="font-mono text-sm">+55 31 97176-1350</span>
                  <Badge variant="outline" className="bg-green-100">Comercial</Badge>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Este é o número do bot - não use para testes de subscriber
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium">URLs dos Webhooks</Label>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div>Suporte: <code>/webhook/botconversa/suporte</code></div>
                <div>Comercial: <code>/webhook/botconversa/comercial</code></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Campos Personalizados - Comercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comercialConfig.customFields.map((field, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-3">
                  <div className="font-medium text-sm">{field.name}</div>
                  <div className="text-xs text-gray-500">{field.type} - {field.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testes de Integração */}
      <Card>
        <CardHeader>
          <CardTitle>Testes de Integração</CardTitle>
          <div className="text-sm text-gray-600 mt-2">
            <p>💡 Para testar corretamente:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Use um número de cliente real que tenha interagido com o bot</li>
              <li>Não use o número do bot (+5531971761350) - ele não será encontrado como subscriber</li>
              <li>Formato esperado: 5511987654321 (com DDI 55 + DDD + número)</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="account">Conta</Label>
              <Select value={testAccount} onValueChange={(value: 'SUPORTE' | 'COMERCIAL') => setTestAccount(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMERCIAL">Comercial</SelectItem>
                  <SelectItem value="SUPORTE">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone do Cliente (para teste)</Label>
              <Input 
                id="phone"
                placeholder="5511987654321"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Não use o número do bot (+5531971761350) - use um número de cliente real
              </p>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleTestIntegration} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncData} disabled={isLoading}>
              Sincronizar Dados
            </Button>
          </div>

          {/* Resultado do Teste */}
          {testResult && (
            <Card className={testResult.success ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResult.success ? 'Sucesso' : 'Erro'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{testResult.message}</p>
                
                {testResult.data && (
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Teste de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-data">Dados JSON do Webhook</Label>
            <Textarea
              id="webhook-data"
              placeholder={`{
  "subscriber": {
    "id": "test123",
    "phone": "5511999887766",
    "name": "Teste Integração",
    "email": "teste@exemplo.com"
  },
  "event_type": "subscriber_created",
  "webhook_id": "webhook_test",
  "company_id": "comercial",
  "timestamp": "${new Date().toISOString()}"
}`}
              value={webhookData}
              onChange={(e) => setWebhookData(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          
          <Button onClick={handleTestWebhook} variant="outline">
            Testar Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Tags Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas Configuradas - Comercial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {comercialConfig.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}