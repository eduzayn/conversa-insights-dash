import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: number;
  tipoDocumento: string;
  nomeArquivo: string;
  urlArquivo?: string;
  status: string;
  dataEnvio: string;
  observacoes?: string;
}

const documentTypes = [
  { value: 'RG', label: 'RG (Documento de Identidade)' },
  { value: 'CPF', label: 'CPF' },
  { value: 'Diploma Superior', label: 'Diploma de Curso Superior' },
  { value: 'Histórico Escolar', label: 'Histórico Escolar' },
  { value: 'Certidão Nascimento', label: 'Certidão de Nascimento' },
  { value: 'Comprovante Residência', label: 'Comprovante de Residência' },
  { value: 'Foto 3x4', label: 'Foto 3x4' },
  { value: 'Outros', label: 'Outros' }
];

export default function Documentos() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/documentos']
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { file: File; tipoDocumento: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('tipoDocumento', data.tipoDocumento);

      const response = await fetch('/api/portal/aluno/documentos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('student_token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar documento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/documentos'] });
      setSelectedFile(null);
      setDocumentType("");
      toast.success('Documento enviado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar documento. Tente novamente.');
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'aprovado': { variant: 'default' as const, label: 'Aprovado', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
      'reprovado': { variant: 'destructive' as const, label: 'Reprovado', icon: XCircle, color: 'text-red-700 bg-red-100' },
      'pendente': { variant: 'secondary' as const, label: 'Pendente', icon: Clock, color: 'text-yellow-700 bg-yellow-100' },
      'em_analise': { variant: 'outline' as const, label: 'Em Análise', icon: AlertCircle, color: 'text-blue-700 bg-blue-100' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, icon: AlertCircle, color: 'text-gray-700 bg-gray-100' };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Apenas arquivos PDF, JPG ou PNG são permitidos.');
        return;
      }
      
      // Validar tamanho (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentType) {
      toast.error('Selecione um arquivo e o tipo de documento.');
      return;
    }
    
    uploadDocumentMutation.mutate({
      file: selectedFile,
      tipoDocumento: documentType
    });
  };

  const handleDownload = (document: Document) => {
    if (document.urlArquivo) {
      window.open(document.urlArquivo, '_blank');
    }
  };

  const statsData = {
    total: documents.length,
    aprovados: documents.filter((d: Document) => d.status === 'aprovado').length,
    pendentes: documents.filter((d: Document) => d.status === 'pendente' || d.status === 'em_analise').length,
    reprovados: documents.filter((d: Document) => d.status === 'reprovado').length
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <p className="text-gray-600">Envie e acompanhe o status dos seus documentos acadêmicos</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Documentos</p>
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
                <p className="text-sm font-medium text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{statsData.aprovados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{statsData.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Reprovados</p>
                <p className="text-2xl font-bold text-red-600">{statsData.reprovados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload de novo documento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enviar Novo Documento</CardTitle>
          <CardDescription>
            Selecione o tipo de documento e faça o upload do arquivo (PDF, JPG ou PNG - máx. 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Arquivo selecionado:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || uploadDocumentMutation.isPending}
            className="w-full md:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadDocumentMutation.isPending ? 'Enviando...' : 'Enviar Documento'}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Meus Documentos</h2>
        
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento enviado</h3>
              <p className="text-gray-500 text-center">
                Você ainda não enviou nenhum documento. Use o formulário acima para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((document: Document) => {
              const statusInfo = getStatusBadge(document.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={document.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{document.tipoDocumento}</CardTitle>
                        <CardDescription className="mt-1">
                          {document.nomeArquivo}
                        </CardDescription>
                      </div>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Data de envio:</span>
                      <span className="font-medium">
                        {new Date(document.dataEnvio).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {document.observacoes && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-1">Observações:</p>
                        <p className="text-sm text-gray-600">{document.observacoes}</p>
                      </div>
                    )}

                    {document.status === 'reprovado' && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <p className="text-sm text-red-700 font-medium">
                            Documento reprovado - Envie um novo arquivo corrigido
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {document.urlArquivo && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Informações importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 text-base">Documentos Obrigatórios</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• RG (Documento de Identidade)</li>
            <li>• CPF</li>
            <li>• Diploma de Curso Superior (para pós-graduação)</li>
            <li>• Histórico Escolar</li>
            <li>• Comprovante de Residência atualizado</li>
            <li>• Foto 3x4 recente</li>
          </ul>
          <p className="mt-3 font-medium">
            Todos os documentos devem estar legíveis e em boa qualidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}