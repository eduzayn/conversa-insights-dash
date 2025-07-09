import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { 
  IdCard, 
  QrCode, 
  Download, 
  Calendar, 
  User, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle,
  Shield,
  MapPin,
  Mail,
  Phone,
  Copy
} from "lucide-react";
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

interface StudentData {
  name: string;
  email: string;
  cpf: string;
}

interface ModernCarteirinhaProps {
  studentData: StudentData;
}

export function ModernCarteirinha({ studentData }: ModernCarteirinhaProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const queryClient = useQueryClient();

  // Simulando dados da carteirinha até a API estar disponível
  const mockCard: StudentCard = {
    id: 1,
    numeroCarteirinha: "2024" + studentData.cpf.slice(-6),
    tokenValidacao: "tk_" + Math.random().toString(36).substr(2, 9),
    qrCodeData: `https://portal.zayn.edu.br/validate/${studentData.cpf}`,
    validoAte: "2025-12-31",
    status: "ativa",
    cursoAtual: "Pós-Graduação em Gestão Escolar",
    student: {
      name: studentData.name,
      cpf: studentData.cpf,
      email: studentData.email
    }
  };

  const card = mockCard; // Substituir pela query real quando disponível

  const isExpired = (validoAte: string) => {
    return new Date(validoAte) < new Date();
  };

  const getValidationUrl = (token: string) => {
    return `${window.location.origin}/api/public/validate-card/${token}`;
  };

  const downloadCard = () => {
    toast.info('Download da carteirinha iniciado...');
    // Implementar download real
  };

  const copyValidationLink = () => {
    const url = getValidationUrl(card.tokenValidacao);
    navigator.clipboard.writeText(url);
    toast.success('Link de validação copiado!');
  };

  if (!card) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carteirinha Estudantil</h1>
          <p className="text-gray-600">Sua identificação digital como estudante</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <IdCard className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Carteirinha não encontrada</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Você ainda não possui uma carteirinha digital. Gere uma agora para ter acesso aos benefícios estudantis.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <IdCard className="h-5 w-5 mr-2" />
              Gerar Carteirinha Digital
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expired = isExpired(card.validoAte);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carteirinha Estudantil</h1>
        <p className="text-gray-600">Sua identificação digital como estudante</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carteirinha Principal */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="relative">
              {/* Frente da Carteirinha */}
              <div className={`transition-transform duration-700 ${cardFlipped ? 'rotate-y-180' : ''}`}>
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-8 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-4 -right-4 w-32 h-32 border-2 border-white rounded-full"></div>
                    <div className="absolute top-20 -left-8 w-24 h-24 border border-white rounded-full"></div>
                    <div className="absolute bottom-8 right-16 w-16 h-16 border border-white rounded-full"></div>
                  </div>

                  {/* Header */}
                  <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold">CARTEIRINHA ESTUDANTIL</h2>
                      <p className="text-blue-200 text-sm">Instituto Educacional Zayn</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-200 text-xs">Nº</p>
                      <p className="font-mono font-bold text-lg">{card.numeroCarteirinha}</p>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="relative z-10 flex items-center gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-300 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-blue-900 font-bold text-xl">
                        {card.student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1">{card.student.name}</h3>
                      <p className="text-blue-200 text-sm mb-1">{card.cursoAtual || 'Curso Principal'}</p>
                      <p className="text-blue-300 text-xs">CPF: {card.student.cpf}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="relative z-10 mt-6 pt-4 border-t border-blue-600 flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-xs">Válida até</p>
                      <p className="font-bold">{new Date(card.validoAte).toLocaleDateString('pt-BR')}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${expired ? 'bg-red-400' : 'bg-green-400'}`}></div>
                      <Badge 
                        variant={expired ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {expired ? 'Vencida' : 'Ativa'}
                      </Badge>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="absolute bottom-2 right-2 text-blue-300 text-xs opacity-50">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Botão para virar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCardFlipped(!cardFlipped)}
                className="absolute top-4 right-4 text-white hover:bg-white/20"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {/* QR Code Section */}
            {showQRCode && (
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-4">QR Code de Validação</h4>
                  <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                    <QRCodeGenerator 
                      value={getValidationUrl(card.tokenValidacao)}
                      size={150}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Escaneie para validar a autenticidade
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* QR Code Toggle */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowQRCode(!showQRCode)}
              className="bg-white/80 backdrop-blur-sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {showQRCode ? 'Ocultar' : 'Mostrar'} QR Code
            </Button>
          </div>
        </div>

        {/* Informações e Ações */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Status da Carteirinha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge 
                  variant={expired ? "destructive" : "default"}
                  className="flex items-center gap-1"
                >
                  {expired ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  {expired ? 'Vencida' : 'Ativa'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Válida até:</span>
                <span className="text-sm font-medium">
                  {new Date(card.validoAte).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Número:</span>
                <span className="text-sm font-mono font-medium">{card.numeroCarteirinha}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={downloadCard}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Carteirinha (PDF)
              </Button>
              
              <Button 
                onClick={copyValidationLink}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link de Validação
              </Button>

              {expired && (
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <IdCard className="h-4 w-4 mr-2" />
                  Renovar Carteirinha
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Informações do Estudante */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Estudante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span>{card.student.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{card.student.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <IdCard className="h-4 w-4 text-gray-400" />
                <span>CPF: {card.student.cpf}</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span>{card.cursoAtual}</span>
              </div>
            </CardContent>
          </Card>

          {/* Benefícios */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 text-lg">Benefícios</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-800">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Meia-entrada em eventos culturais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Desconto em transporte público
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Acesso a bibliotecas acadêmicas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Validação digital com QR Code
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}