import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Key, Users, ShieldCheck, Copy, Plus, Calendar, User, ArrowLeft, UserX, UserCheck } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface RegistrationToken {
  id: number;
  token: string;
  role: 'admin' | 'agent';
  createdBy: number;
  isUsed: boolean;
  usedBy?: number;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  // Dados do usuário que utilizou o token
  userName?: string;
  userEmail?: string;
  userCreatedAt?: string;
  userIsActive?: boolean;
}

const GerenciarTokens: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'agent'>('agent');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar tokens
  const { data: tokens = [], isLoading, error } = useQuery({
    queryKey: ['/api/registration-tokens'],
    queryFn: async () => {
      const response = await fetch('/api/registration-tokens', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar tokens');
      return response.json();
    }
  });

  // Criar token
  const createTokenMutation = useMutation({
    mutationFn: async (role: 'admin' | 'agent') => {
      const response = await fetch('/api/registration-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error('Erro ao criar token');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-tokens'] });
      toast({
        title: "Token criado com sucesso!",
        description: "O token foi gerado e está pronto para uso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar token",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para desativar usuário
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao desativar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-tokens'] });
      toast({
        title: "Usuário desativado!",
        description: "O usuário foi desativado e não pode mais acessar o sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desativar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para reativar usuário
  const activateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/activate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao reativar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-tokens'] });
      toast({
        title: "Usuário reativado!",
        description: "O usuário foi reativado e pode acessar o sistema novamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao reativar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateToken = () => {
    createTokenMutation.mutate(selectedRole);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Token copiado!",
      description: "O token foi copiado para a área de transferência.",
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (token: RegistrationToken) => {
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    
    if (token.isUsed) {
      return <Badge variant="secondary">Usado</Badge>;
    }
    
    if (expiresAt < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="destructive"><ShieldCheck className="w-3 h-3 mr-1" />Administrador</Badge>;
    }
    return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Atendente</Badge>;
  };

  const getUserStatusBadge = (isActive?: boolean) => {
    if (isActive === undefined) return null;
    
    if (isActive) {
      return <Badge variant="default" className="bg-green-500"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>;
    }
    return <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" />Inativo</Badge>;
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Erro ao carregar tokens: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <Key className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Tokens de Registro</h1>
          <p className="text-gray-600">Gere tokens únicos para autocadastro de novos usuários administrativos</p>
        </div>
      </div>

      {/* Seção de criação de token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Gerar Novo Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'agent') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Atendente
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleCreateToken} 
              disabled={createTokenMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {createTokenMutation.isPending ? "Gerando..." : "Gerar Token"}
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Tokens são únicos e expiram em 7 dias</p>
            <p>• Cada token só pode ser usado uma vez</p>
            <p>• O tipo de usuário define as permissões após o cadastro</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Lista de tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Tokens Gerados ({tokens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando tokens...</div>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum token foi gerado ainda</p>
              <p className="text-sm">Clique em "Gerar Token" para criar o primeiro</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token: RegistrationToken) => (
                <div key={token.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(token.role)}
                        {getStatusBadge(token)}
                        <span className="text-sm text-gray-500">
                          ID: {token.id}
                        </span>
                      </div>
                      
                      <div className="font-mono text-sm bg-white p-2 border rounded flex items-center justify-between">
                        <span className="break-all">{token.token}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(token.token)}
                          className="ml-2"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Criado: {formatDate(token.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expira: {formatDate(token.expiresAt)}
                        </div>
                        {token.isUsed && token.usedAt && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Usado: {formatDate(token.usedAt)}
                          </div>
                        )}
                        {token.isUsed && token.userName && (
                          <div className="bg-blue-50 p-3 mt-2 rounded border-l-4 border-blue-200">
                            <div className="text-sm font-medium text-blue-800 mb-2">Usuário que utilizou o token:</div>
                            <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
                              <User className="w-3 h-3" />
                              <span className="font-medium">{token.userName}</span>
                              {getUserStatusBadge(token.userIsActive)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                              <span>📧</span>
                              <span>{token.userEmail}</span>
                            </div>
                            {token.userCreatedAt && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 mb-3">
                                <Calendar className="w-3 h-3" />
                                Cadastro: {formatDate(token.userCreatedAt)}
                              </div>
                            )}
                            
                            {/* Botões de ação para usuário */}
                            {token.usedBy && (
                              <div className="flex gap-2 pt-2 border-t border-blue-200">
                                {token.userIsActive ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deactivateUserMutation.mutate(token.usedBy!)}
                                    disabled={deactivateUserMutation.isPending}
                                    className="text-xs"
                                  >
                                    <UserX className="w-3 h-3 mr-1" />
                                    {deactivateUserMutation.isPending ? 'Desativando...' : 'Desativar Usuário'}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => activateUserMutation.mutate(token.usedBy!)}
                                    disabled={activateUserMutation.isPending}
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    {activateUserMutation.isPending ? 'Reativando...' : 'Reativar Usuário'}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarTokens;