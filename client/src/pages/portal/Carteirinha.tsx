import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdCard, QrCode, Download, Calendar, User, GraduationCap, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StudentCard {
  id: number;
  numeroCarteirinha: string;
  tokenValidacao: string;
  qrCodeData: string;
  validoAte: string;
  status: string;
  cursoAtual?: string;
  urlFoto?: string;
  student: {
    name: string;
    cpf: string;
    email: string;
  };
}

export default function Carteirinha() {
  const [showQRCode, setShowQRCode] = useState(false);
  const queryClient = useQueryClient();

  const { data: card, isLoading, error } = useQuery({
    queryKey: ['/api/portal/aluno/carteirinha']
  });

  const generateCardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/student/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('student_token')}`
        },
        body: JSON.stringify({
          cursoAtual: 'Curso Principal' // Pode ser dinâmico
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar carteirinha');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/carteirinha'] });
      toast.success('Carteirinha gerada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao gerar carteirinha. Tente novamente.');
    }
  });

  const downloadCard = () => {
    // Implementar download da carteirinha como PDF
    toast.info('Funcionalidade de download será implementada em breve');
  };

  const generateQRCode = (data: string) => {
    // Para este exemplo, vamos usar um serviço online para gerar QR Code
    // Em produção, você pode usar uma biblioteca como qrcode
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
    return qrCodeUrl;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativa': { variant: 'default' as const, label: 'Ativa', icon: CheckCircle },
      'inativa': { variant: 'destructive' as const, label: 'Inativa', icon: AlertCircle },
      'bloqueada': { variant: 'outline' as const, label: 'Bloqueada', icon: AlertCircle },
      'vencida': { variant: 'secondary' as const, label: 'Vencida', icon: AlertCircle }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, icon: AlertCircle };
  };

  const isExpired = (validoAte: string) => {
    return new Date(validoAte) < new Date();
  };

  const getValidationUrl = (token: string) => {
    return `${window.location.origin}/api/public/validate-card/${token}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Carteirinha do Estudante</h1>
          <p className="text-gray-600">Sua identificação digital como estudante</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IdCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Carteirinha não encontrada</h3>
            <p className="text-gray-500 text-center mb-4">
              Você ainda não possui uma carteirinha digital. Gere uma agora para ter acesso aos benefícios estudantis.
            </p>
            <Button 
              onClick={() => generateCardMutation.mutate()}
              disabled={generateCardMutation.isPending}
            >
              <IdCard className="h-4 w-4 mr-2" />
              {generateCardMutation.isPending ? 'Gerando...' : 'Gerar Carteirinha'}
            </Button>
          </CardContent>
        </Card>

        {/* Informações sobre benefícios */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 text-base">Benefícios da Carteirinha</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <ul className="space-y-1">
              <li>• Meia-entrada em cinemas, teatros e eventos culturais</li>
              <li>• Desconto em transporte público</li>
              <li>• Comprovação de vínculo estudantil</li>
              <li>• Acesso a bibliotecas e recursos acadêmicos</li>
              <li>• Validação digital com QR Code</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusBadge(isExpired(card.validoAte) ? 'vencida' : card.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carteirinha do Estudante</h1>
        <p className="text-gray-600">Sua identificação digital como estudante</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carteirinha visual */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">CARTEIRINHA ESTUDANTIL</h2>
                <p className="text-blue-100 text-sm">Instituto Educacional</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs">Nº</p>
                <p className="font-mono font-bold">{card.numeroCarteirinha}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg">
                {card.student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg">{card.student.name}</h3>
                <p className="text-blue-100 text-sm">{card.cursoAtual || 'Curso Principal'}</p>
                <p className="text-blue-100 text-xs">CPF: {card.student.cpf}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-500 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">Válida até</p>
                <p className="font-bold">{new Date(card.validoAte).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <Badge variant={statusInfo.variant} className="text-xs">
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-center">
              <Button
                onClick={() => setShowQRCode(!showQRCode)}
                variant="outline"
                size="sm"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {showQRCode ? 'Ocultar' : 'Mostrar'} QR Code
              </Button>
            </div>
            
            {showQRCode && (
              <div className="mt-4 text-center">
                <img
                  src={generateQRCode(getValidationUrl(card.tokenValidacao))}
                  alt="QR Code de Validação"
                  className="mx-auto mb-2"
                />
                <p className="text-xs text-gray-500">
                  Escaneie para validar a autenticidade
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Informações e ações */}
        <div className="space-y-6">
          {/* Status da carteirinha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Status da Carteirinha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status atual:</span>
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Válida até:</span>
                <span className="text-sm font-medium">
                  {new Date(card.validoAte).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Número da carteirinha:</span>
                <span className="text-sm font-mono font-medium">{card.numeroCarteirinha}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Opções para sua carteirinha digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={downloadCard}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Carteirinha (PDF)
              </Button>
              
              <Button 
                onClick={() => {
                  const url = getValidationUrl(card.tokenValidacao);
                  navigator.clipboard.writeText(url);
                  toast.success('Link de validação copiado!');
                }}
                className="w-full"
                variant="outline"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Copiar Link de Validação
              </Button>

              {isExpired(card.validoAte) && (
                <Button 
                  onClick={() => generateCardMutation.mutate()}
                  disabled={generateCardMutation.isPending}
                  className="w-full"
                >
                  <IdCard className="h-4 w-4 mr-2" />
                  Renovar Carteirinha
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Avisos importantes */}
          {isExpired(card.validoAte) && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Carteirinha Vencida
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-red-800">
                <p>
                  Sua carteirinha venceu em {new Date(card.validoAte).toLocaleDateString('pt-BR')}. 
                  Renove-a para continuar usufruindo dos benefícios estudantis.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações sobre uso */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 text-base">Como usar sua carteirinha</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <ul className="space-y-1">
                <li>• Apresente a carteirinha digital em estabelecimentos</li>
                <li>• Use o QR Code para validação rápida</li>
                <li>• Mantenha sempre atualizada</li>
                <li>• Verifique a validade regularmente</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}