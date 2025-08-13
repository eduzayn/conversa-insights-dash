
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Clock, Users, UserCheck, UserX, Crown, TrendingUp, Calendar, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

// Interface para os dados de presença
interface PresenceData {
  summary: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    averageOnlineTime: string;
    attendanceRate: number;
  };
  dailyAttendance: Array<{
    name: string;
    email: string;
    team: string;
    loginTime: string;
    logoutTime: string;
    totalOnlineTime: string;
    status: string;
    inactivityCount: number;
    lastActivity: string;
    userId: number;
  }>;
  weeklyStats: {
    attendanceRate: number;
    averageDailyTime: string;
    totalInactivityCount: number;
  };
}

interface RankingData {
  period: string;
  rankings: {
    byOnlineTime: Array<{
      userId: number;
      username: string;
      email: string;
      team: string;
      totalOnlineMinutes: number;
      rank: number;
    }>;
    byAttendanceRate: Array<{
      userId: number;
      username: string;
      team: string;
      attendanceRate: number;
      rank: number;
    }>;
  };
  summary: {
    totalUsers: number;
    totalOnlineHours: number;
    averageAttendanceRate: number;
  };
}

const Presenca = () => {
  const { user, loading } = useAuth();
  useActivityMonitor();
  
  const [selectedPeriod, setSelectedPeriod] = useState('hoje');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedTeam, setSelectedTeam] = useState('todas');

  // Buscar dados reais de presença
  const { data: presenceData, isLoading: isLoadingPresence, error: presenceError } = useQuery<PresenceData>({
    queryKey: ['/api/presence/dashboard'],
    queryFn: () => apiRequest('/api/presence/dashboard'),
    enabled: !!user
  });

  // Buscar ranking semanal
  const { data: weeklyRanking, isLoading: isLoadingRanking } = useQuery<RankingData>({
    queryKey: ['/api/presence/ranking', { period: 'week' }],
    queryFn: () => apiRequest('/api/presence/ranking?period=week'),
    enabled: !!user
  });

  // Buscar ranking mensal
  const { data: monthlyRanking } = useQuery<RankingData>({
    queryKey: ['/api/presence/ranking', { period: 'month' }],
    queryFn: () => apiRequest('/api/presence/ranking?period=month'),
    enabled: !!user
  });

  // Função para exportar CSV
  const handleExportCSV = () => {
    if (!presenceData) return;
    
    const csvHeaders = ['Funcionário', 'Email', 'Equipe', 'Status', 'Login', 'Logout', 'Tempo Online', 'Inatividades', 'Última Atividade'];
    const csvData = presenceData.dailyAttendance.map(employee => [
      employee.name,
      employee.email,
      employee.team,
      employee.status,
      employee.loginTime,
      employee.logoutTime,
      employee.totalOnlineTime,
      employee.inactivityCount.toString(),
      employee.lastActivity
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_presenca_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (presenceError) {
    return (
      <AdminLayout>
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar dados de presença</p>
          <p className="text-gray-400 text-sm mt-2">{presenceError?.message || 'Erro desconhecido'}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!presenceData && !isLoadingPresence) {
    return (
      <AdminLayout>
        <div className="text-center">
          <p className="text-gray-600">Nenhum dado de presença disponível</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Presença</h1>
                <p className="text-gray-600">Controle de jornada e tempo efetivo de trabalho</p>
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="mes-passado">Mês Passado</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleExportCSV}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{presenceData?.summary?.totalEmployees || 0}</div>
                  <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Presentes Hoje</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{presenceData?.summary?.presentToday || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {presenceData?.summary?.totalEmployees ? Math.round((presenceData.summary.presentToday / presenceData.summary.totalEmployees) * 100) : 0}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ausentes Hoje</CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{presenceData?.summary?.absentToday || 0}</div>
                  <p className="text-xs text-muted-foreground">Não fizeram login</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio Online</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{presenceData?.summary?.averageOnlineTime || "0h 0m"}</div>
                  <p className="text-xs text-muted-foreground">Por funcionário hoje</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{presenceData?.summary?.attendanceRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">Presença hoje</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs para organizar informações */}
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="bg-gray-100 h-12">
                <TabsTrigger value="dashboard" className="px-6 py-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dashboard Diário
                </TabsTrigger>
                <TabsTrigger value="ranking" className="px-6 py-3">
                  <Crown className="h-4 w-4 mr-2" />
                  Rankings
                </TabsTrigger>
                <TabsTrigger value="analytics" className="px-6 py-3">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Análises
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                {/* Funcionário Mais Ativo Hoje */}
                {presenceData?.dailyAttendance && presenceData.dailyAttendance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        Funcionário Mais Ativo Hoje
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const mostActive = presenceData.dailyAttendance
                          .filter(emp => emp.status !== 'Ausente')
                          .sort((a, b) => {
                            const timeA = a.totalOnlineTime.match(/(\d+)h\s*(\d+)m/);
                            const timeB = b.totalOnlineTime.match(/(\d+)h\s*(\d+)m/);
                            const minutesA = timeA ? parseInt(timeA[1]) * 60 + parseInt(timeA[2]) : 0;
                            const minutesB = timeB ? parseInt(timeB[1]) * 60 + parseInt(timeB[2]) : 0;
                            return minutesB - minutesA;
                          })[0];

                        return mostActive ? (
                          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                            <div>
                              <h3 className="font-semibold text-lg">{mostActive.name}</h3>
                              <p className="text-gray-600">{mostActive.team}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-yellow-600">{mostActive.totalOnlineTime}</div>
                              <p className="text-sm text-gray-600">Tempo online</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">Nenhum funcionário ativo hoje</p>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Attendance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Controle de Presença Diário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Funcionário</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Login</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Logout</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Tempo Online</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Inatividades</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Última Atividade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presenceData?.dailyAttendance?.map((employee) => (
                            <tr key={`${employee.userId}-${employee.email}`} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{employee.name}</td>
                              <td className="py-3 px-4 text-gray-600 text-sm">{employee.email}</td>
                              <td className="py-3 px-4">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {employee.team}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={
                                  employee.status === 'Online' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  employee.status === 'Ativo' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }>
                                  {employee.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{employee.loginTime}</td>
                              <td className="py-3 px-4 text-gray-600">{employee.logoutTime}</td>
                              <td className="py-3 px-4 font-medium text-green-600">{employee.totalOnlineTime}</td>
                              <td className="py-3 px-4 text-center">
                                {employee.inactivityCount > 0 ? (
                                  <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                                    {employee.inactivityCount}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-gray-600">{employee.lastActivity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ranking" className="space-y-6">
                {isLoadingRanking ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ranking Semanal por Tempo Online */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-blue-600" />
                          Top 5 - Tempo Online (Semana)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {weeklyRanking?.rankings.byOnlineTime.slice(0, 5).map((user, index) => (
                            <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-200 text-yellow-800' :
                                  index === 1 ? 'bg-gray-200 text-gray-800' :
                                  index === 2 ? 'bg-amber-200 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-sm text-gray-600">{user.team}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-blue-600">
                                  {Math.floor(user.totalOnlineMinutes / 60)}h {user.totalOnlineMinutes % 60}m
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ranking Semanal por Taxa de Presença */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Top 5 - Taxa de Presença (Semana)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {weeklyRanking?.rankings.byAttendanceRate.slice(0, 5).map((user, index) => (
                            <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-200 text-yellow-800' :
                                  index === 1 ? 'bg-gray-200 text-gray-800' :
                                  index === 2 ? 'bg-amber-200 text-amber-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-sm text-gray-600">{user.team}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {Math.round(user.attendanceRate)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {/* Comparativo Entre Equipes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativo Entre Equipes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const teamStats = presenceData?.dailyAttendance?.reduce((acc, employee) => {
                        if (!acc[employee.team]) {
                          acc[employee.team] = {
                            total: 0,
                            present: 0,
                            totalMinutes: 0,
                            inactivities: 0
                          };
                        }
                        
                        acc[employee.team].total++;
                        if (employee.status !== 'Ausente') {
                          acc[employee.team].present++;
                          
                          const timeMatch = employee.totalOnlineTime.match(/(\d+)h\s*(\d+)m/);
                          if (timeMatch) {
                            const minutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
                            acc[employee.team].totalMinutes += minutes;
                          }
                        }
                        acc[employee.team].inactivities += employee.inactivityCount;
                        
                        return acc;
                      }, {} as Record<string, any>);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(teamStats).map(([team, stats]) => (
                            <div key={team} className="p-4 border rounded-lg">
                              <h3 className="font-semibold text-lg mb-2">{team}</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Taxa de Presença:</span>
                                  <span className="font-medium">
                                    {Math.round((stats.present / stats.total) * 100)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Tempo Médio:</span>
                                  <span className="font-medium">
                                    {stats.present > 0 ? 
                                      `${Math.floor(stats.totalMinutes / stats.present / 60)}h ${Math.floor((stats.totalMinutes / stats.present) % 60)}m` : 
                                      '0h 0m'
                                    }
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Inatividades:</span>
                                  <span className="font-medium">{stats.inactivities}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Semanal de Presença</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{presenceData?.weeklyStats?.attendanceRate || 0}%</div>
                    <div className="text-sm text-green-700">Taxa de Presença</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{presenceData?.weeklyStats?.averageDailyTime || "0h 0m"}</div>
                    <div className="text-sm text-blue-700">Média Diária</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{presenceData?.weeklyStats?.totalInactivityCount || 0}</div>
                    <div className="text-sm text-yellow-700">Inatividades Totais</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
    </AdminLayout>
  );
};

export default Presenca;
