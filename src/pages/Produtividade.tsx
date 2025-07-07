
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Activity, Award, Target } from "lucide-react";
import { AttendanceVolumeChart } from "@/components/charts/AttendanceVolumeChart";
import { TeamProductivityChart } from "@/components/charts/TeamProductivityChart";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";

const mockProductivityData = {
  individualData: [
    { 
      name: "Ana Santos", 
      team: "Vendas",
      todayAttendances: 23,
      weekAttendances: 127,
      monthAttendances: 456,
      totalAttendances: 1247,
      dailyAverage: 18.5,
      responseTime: "2m 15s",
      messagesPerChat: 8.3,
      ranking: 1
    },
    { 
      name: "Bruna Reis", 
      team: "Comercial",
      todayAttendances: 27,
      weekAttendances: 134,
      monthAttendances: 487,
      totalAttendances: 1356,
      dailyAverage: 20.1,
      responseTime: "1m 45s",
      messagesPerChat: 7.2,
      ranking: 2
    },
    { 
      name: "Carlos Lima", 
      team: "Suporte",
      todayAttendances: 19,
      weekAttendances: 98,
      monthAttendances: 398,
      totalAttendances: 1098,
      dailyAverage: 16.2,
      responseTime: "3m 20s",
      messagesPerChat: 9.1,
      ranking: 3
    }
  ],
  teamData: [
    { team: "Vendas", totalAttendances: 156, avgPerAgent: 31.2, avgResponseTime: "2m 30s", totalAgents: 5 },
    { team: "Comercial", totalAttendances: 78, avgPerAgent: 19.5, avgResponseTime: "2m 15s", totalAgents: 4 },
    { team: "Suporte", totalAttendances: 89, avgPerAgent: 29.7, avgResponseTime: "3m 45s", totalAgents: 3 }
  ]
};

const Produtividade = () => {
  const { user, loading } = useAuth();
  useActivityMonitor();

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
                <p className="text-gray-600">Desempenho e eficiência dos atendentes</p>
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio Resposta</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2m 36s</div>
                  <p className="text-xs text-muted-foreground">-15s desde ontem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Bruna</div>
                  <p className="text-xs text-muted-foreground">27 atendimentos hoje</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Volume de Atendimentos por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceVolumeChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produtividade por Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamProductivityChart />
                </CardContent>
              </Card>
            </div>

            {/* Individual Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Produtividade Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ranking</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Atendente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Hoje</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Esta Semana</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Este Mês</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Média Diária</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tempo Resposta</th>
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
                          <td className="py-3 px-4 font-medium text-green-600">{agent.todayAttendances}</td>
                          <td className="py-3 px-4 text-gray-600">{agent.weekAttendances}</td>
                          <td className="py-3 px-4 text-gray-600">{agent.monthAttendances}</td>
                          <td className="py-3 px-4 text-gray-600">{agent.totalAttendances.toLocaleString()}</td>
                          <td className="py-3 px-4 text-blue-600 font-medium">{agent.dailyAverage}</td>
                          <td className="py-3 px-4 text-purple-600 font-medium">{agent.responseTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Total Atendimentos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Média por Atendente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tempo Médio Resposta</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Atendentes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockProductivityData.teamData.map((team) => (
                        <tr key={team.team} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{team.team}</td>
                          <td className="py-3 px-4 font-medium text-green-600">{team.totalAttendances}</td>
                          <td className="py-3 px-4 text-blue-600 font-medium">{team.avgPerAgent}</td>
                          <td className="py-3 px-4 text-purple-600 font-medium">{team.avgResponseTime}</td>
                          <td className="py-3 px-4 text-gray-600">{team.totalAgents}</td>
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
