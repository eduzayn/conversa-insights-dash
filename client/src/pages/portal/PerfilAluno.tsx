import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit, Save, X, GraduationCap, Calendar, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  matriculaAtiva: boolean;
  dataMatricula?: string;
  cursoAtual?: string;
  modalidadeAtual?: string;
  statusDocumentacao?: string;
  observacoes?: string;
}

export default function PerfilAluno() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentProfile>>({});
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/portal/aluno/perfil']
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<StudentProfile>) => {
      const response = await fetch('/api/portal/aluno/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('student_token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portal/aluno/perfil'] });
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    }
  });

  const handleInputChange = (field: keyof StudentProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return { variant: 'outline' as const, label: 'Não informado' };
    
    const variants = {
      'aprovada': { variant: 'default' as const, label: 'Aprovada' },
      'pendente': { variant: 'secondary' as const, label: 'Pendente' },
      'reprovada': { variant: 'destructive' as const, label: 'Reprovada' },
      'em_analise': { variant: 'outline' as const, label: 'Em Análise' }
    };
    
    return variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="col-span-2 h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Perfil não encontrado</h3>
            <p className="text-gray-500 text-center">
              Não foi possível carregar os dados do seu perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil do Aluno</h1>
          <p className="text-gray-600">Visualize e edite suas informações pessoais e acadêmicas</p>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações básicas */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl">
                {profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{profile.name}</CardTitle>
            <CardDescription>
              {profile.cursoAtual ? `${profile.cursoAtual} - ${profile.modalidadeAtual}` : 'Curso não definido'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status da Matrícula:</span>
              <Badge variant={profile.matriculaAtiva ? 'default' : 'destructive'}>
                {profile.matriculaAtiva ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Documentação:</span>
              <Badge variant={getStatusBadge(profile.statusDocumentacao).variant}>
                {getStatusBadge(profile.statusDocumentacao).label}
              </Badge>
            </div>
            
            {profile.dataMatricula && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Matrícula desde:</span>
                <span className="text-sm font-medium">
                  {new Date(profile.dataMatricula).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados pessoais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{profile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium">{profile.email}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <div className="flex items-center gap-2 py-2">
                  <p className="text-sm font-medium">{profile.cpf}</p>
                  <span className="text-xs text-gray-500">(não editável)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                {isEditing ? (
                  <Input
                    id="telefone"
                    value={formData.telefone || ''}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium">{profile.telefone || 'Não informado'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  {isEditing ? (
                    <Input
                      id="endereco"
                      value={formData.endereco || ''}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.endereco || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  {isEditing ? (
                    <Input
                      id="cidade"
                      value={formData.cidade || ''}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.cidade || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  {isEditing ? (
                    <Input
                      id="estado"
                      value={formData.estado || ''}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      placeholder="SP"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.estado || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  {isEditing ? (
                    <Input
                      id="cep"
                      value={formData.cep || ''}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.cep || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Observações */}
            {(isEditing || profile.observacoes) && (
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  {isEditing ? (
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes || ''}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      placeholder="Informações adicionais..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm py-2 bg-gray-50 p-3 rounded-md">
                      {profile.observacoes || 'Nenhuma observação'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações acadêmicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Informações Acadêmicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Curso Atual</h4>
              <p className="text-sm text-gray-600">
                {profile.cursoAtual || 'Não definido'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Modalidade</h4>
              <p className="text-sm text-gray-600">
                {profile.modalidadeAtual || 'Não definido'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data da Matrícula</h4>
              <p className="text-sm text-gray-600">
                {profile.dataMatricula 
                  ? new Date(profile.dataMatricula).toLocaleDateString('pt-BR')
                  : 'Não informado'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}