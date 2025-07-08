import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, Settings, BarChart3, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface DepartmentStats {
  name: string;
  members: number;
  emails: number;
  capacity: number;
}

interface RoutingStats {
  totalDepartments: number;
  totalMembers: number;
  departments: DepartmentStats[];
}

export default function GerenciamentoRoteamento() {
  const [comercialStats, setComercialStats] = useState<RoutingStats | null>(null);
  const [suporteStats, setSuporteStats] = useState<RoutingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoutingStats = async () => {
    try {
      setLoading(true);
      // Simular dados baseados na configuração
      const comercialData: RoutingStats = {
        totalDepartments: 9,
        totalMembers: 22,
        departments: [
          { name: 'COMERCIAL', members: 11, emails: 11, capacity: 110 },
          { name: 'COBRANÇA', members: 1, emails: 1, capacity: 10 },
          { name: 'SUPORTE', members: 1, emails: 1, capacity: 10 },
          { name: 'TUTORIA', members: 2, emails: 2, capacity: 20 },
          { name: 'SECRETARIA PÓS', members: 2, emails: 2, capacity: 20 },
          { name: 'SECRETARIA SEGUNDA GRADUAÇÃO', members: 2, emails: 2, capacity: 20 },
          { name: 'SUPORTE UNICV', members: 1, emails: 1, capacity: 10 },
          { name: 'FINANCEIRO', members: 1, emails: 1, capacity: 10 },
          { name: 'DOCUMENTAÇÃO', members: 1, emails: 1, capacity: 10 }
        ]
      };
      
      const suporteData: RoutingStats = {
        totalDepartments: 9,
        totalMembers: 22,
        departments: [
          { name: 'COMERCIAL', members: 11, emails: 1, capacity: 110 },
          { name: 'COBRANÇA', members: 1, emails: 1, capacity: 10 },
          { name: 'SUPORTE', members: 1, emails: 1, capacity: 10 },
          { name: 'TUTORIA', members: 2, emails: 2, capacity: 20 },
          { name: 'SECRETARIA PÓS', members: 2, emails: 2, capacity: 20 },
          { name: 'SECRETARIA SEGUNDA GRADUAÇÃO', members: 2, emails: 2, capacity: 20 },
          { name: 'SUPORTE UNICV', members: 1, emails: 1, capacity: 10 },
          { name: 'FINANCEIRO', members: 1, emails: 1, capacity: 10 },
          { name: 'DOCUMENTAÇÃO', members: 1, emails: 1, capacity: 10 }
        ]
      };
      
      setComercialStats(comercialData);
      setSuporteStats(suporteData);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas de roteamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutingStats();
  }, []);

  const DepartmentCard = ({ dept }: { dept: DepartmentStats }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{dept.name}</CardTitle>
          <Badge variant="outline">{dept.members} membros</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Membros</p>
            <p className="font-semibold">{dept.members}</p>
          </div>
          <div>
            <p className="text-gray-600">Emails</p>
            <p className="font-semibold">{dept.emails}</p>
          </div>
          <div>
            <p className="text-gray-600">Capacidade</p>
            <p className="font-semibold">{dept.capacity}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AccountTab = ({ stats, accountName }: { stats: RoutingStats | null, accountName: string }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total de Departamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalDepartments || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Capacidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.departments.reduce((sum, dept) => sum + dept.capacity, 0) || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Departamentos - {accountName}</CardTitle>
          <CardDescription>
            Estrutura organizacional e capacidade de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.departments.map((dept) => (
              <DepartmentCard key={dept.name} dept={dept} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando configurações de roteamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Roteamento</h1>
        <p className="text-gray-600">
          Configure e monitore o roteamento automático de conversas por departamento
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Fase 2 Implementada:</strong> Roteamento automático baseado em tags do BotConversa está ativo. 
          Leads serão direcionados automaticamente para os departamentos apropriados.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="comercial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comercial">
            <Users className="h-4 w-4 mr-2" />
            Comercial
          </TabsTrigger>
          <TabsTrigger value="suporte">
            <Settings className="h-4 w-4 mr-2" />
            Suporte
          </TabsTrigger>
          <TabsTrigger value="metricas">
            <BarChart3 className="h-4 w-4 mr-2" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comercial">
          <AccountTab stats={comercialStats} accountName="Comercial" />
        </TabsContent>

        <TabsContent value="suporte">
          <AccountTab stats={suporteStats} accountName="Suporte" />
        </TabsContent>

        <TabsContent value="metricas">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Roteamento</CardTitle>
              <CardDescription>
                Estatísticas de performance e distribuição de leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  Métricas detalhadas serão exibidas aqui conforme os dados são processados
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={fetchRoutingStats} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>
    </div>
  );
}