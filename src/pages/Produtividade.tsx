
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, Clock, TrendingUp, Activity } from "lucide-react";
import { ProductivityTimeChart } from "@/components/charts/ProductivityTimeChart";
import { AttendanceVolumeChart } from "@/components/charts/AttendanceVolumeChart";
import { TeamProductivityChart } from "@/components/charts/TeamProductivityChart";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";

const mockProductivityData = {
  individualData: [
    { 
      name: "Ana Santos", 
      team: "Vendas",
      todayLogin: "08:30", 
      todayLogout: "17:30", 
      todayActiveTime: "8h 45m",
      weekActiveTime: "42h 15m",
      monthActiveTime: "168h 30m",
      todayAttendances: 23,
      totalAttendances: 1247,
      dailyAverage: 18.5,
      ranking: 1
    },
    { 
      name: "Carlos Lima", 
      team: "Suporte",
      todayLogin: "09:00", 
      todayLogout: "18:00", 
      todayActiveTime: "8h 20m",
      weekActiveTime: "39h 45m",
      monthActiveTime: "158h 20m",
      todayAttendances: 19,
      totalAttendances: 1098,
      dailyAverage: 16.2,
      ranking: 3
    },
    { 
      name: "Bruna Reis", 
      team: "Comercial",
      todayLogin: "08:45", 
      todayLogout: "17:45", 
      todayActiveTime: "8h 30m",
      weekActiveTime: "41h 30m",
      monthActiveTime: "162h 45m",
      todayAttendances: 27,
      totalAttendances: 1356,
      dailyAverage: 20.1,
      ranking: 2
    }
  ],
  teamData: [
    { team: "Vendas", activeAgents: 5, totalAttendances: 156, avgPerAgent: 31.2, avgOnlineTime: "8h 15m" },
    { team: "Suporte", activeAgents: 3, totalAttendances: 89, avgPerAgent: 29.7, avgOnlineTime: "8h 05m" },
    { team: "Comercial", activeAgents: 4, totalAttendances: 78, avgPerAgent: 19.5, avgOnlineTime: "7h 45m" }
  ]
};

const Produtividade = () => {
  const { user, loading } = useAuth();
  useActivityMonitor(); // Hook para monitorar atividade e fazer logout automático

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Produtividade</h1>
                <p className="text-gray-600">Acompanhe o desempenho individual e por equipe</p>
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
                  </SelectContent>
                </Select>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atendentes Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockProductivityData.teamData.reduce((acc, team) => acc + team.activeAgents, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">+2 desde ontem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio Online</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8h 22m</div>
                  <p className="text-xs text-muted-foreground">+15m desde ontem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Atendimentos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">323</div>
                  <p className="text-xs text-muted-foreground">+12% desde ontem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média por Atendente</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">26.9</div>
                  <p className="text-xs text-muted-foreground">+8% desde ontem</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo Online por Atendente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductivityTimeChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Volume de Atendimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceVolumeChart />
                </CardContent>
              </Card>
            </div>

            {/* Team Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamProductivityChart />
              </CardContent>
            </Card>

            {/* Individual Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Desempenho Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ranking</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Atendente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Login Hoje</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Logout Hoje</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tempo Ativo Hoje</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Atend. Hoje</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Total Atend.</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Média Diária</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockProductivityData.individualData
                        .sort((a, b) => a.ranking - b.ranking)
                        .map((agent) => (
                        <tr key={agent.name} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                              agent.ranking === 1 ? 'bg-yellow-500' :
                              agent.ranking === 2 ? 'bg-gray-400' :
                              agent.ranking === 3 ? 'bg-amber-600' : 'bg-gray-300'
                            }`}>
                              {agent.ranking}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">{agent.name}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {agent.team}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{agent.todayLogin}</td>
                          <td className="py-3 px-4 text-gray-600">{agent.todayLogout}</td>
                          <td className="py-3 px-4 font-medium text-green-600">{agent.todayActiveTime}</td>
                          <td className="py-3 px-4 font-medium">{agent.todayAttendances}</td>
                          <td className="py-3 px-4 text-gray-600">{agent.totalAttendances.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{agent.dailyAverage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Team Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo por Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Atendentes Ativos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Total Atendimentos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Média por Atendente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tempo Médio Online</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockProductivityData.teamData.map((team) => (
                        <tr key={team.team} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{team.team}</td>
                          <td className="py-3 px-4">{team.activeAgents}</td>
                          <td className="py-3 px-4 font-medium">{team.totalAttendances}</td>
                          <td className="py-3 px-4 text-green-600 font-medium">{team.avgPerAgent}</td>
                          <td className="py-3 px-4 text-blue-600 font-medium">{team.avgOnlineTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Produtividade;
