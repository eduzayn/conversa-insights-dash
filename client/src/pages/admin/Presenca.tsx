
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Clock, Users, UserCheck, UserX } from "lucide-react";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";

const mockPresenceData = {
  dailyAttendance: [
    {
      name: "Ana Santos",
      team: "Vendas", 
      loginTime: "08:30",
      logoutTime: "17:30",
      totalOnlineTime: "8h 45m",
      status: "Ativo",
      inactivityCount: 2,
      lastActivity: "16:45"
    },
    {
      name: "Carlos Lima",
      team: "Suporte",
      loginTime: "09:00",
      logoutTime: "18:00", 
      totalOnlineTime: "8h 20m",
      status: "Ativo",
      inactivityCount: 1,
      lastActivity: "17:30"
    },
    {
      name: "Bruna Reis",
      team: "Comercial",
      loginTime: "08:45",
      logoutTime: "-",
      totalOnlineTime: "9h 15m",
      status: "Online",
      inactivityCount: 0,
      lastActivity: "18:00"
    },
    {
      name: "Diego Costa",
      team: "Suporte",
      loginTime: "-",
      logoutTime: "-",
      totalOnlineTime: "0h 00m",
      status: "Ausente",
      inactivityCount: 0,
      lastActivity: "-"
    }
  ],
  summary: {
    totalEmployees: 12,
    presentToday: 9, 
    absentToday: 3,
    averageOnlineTime: "7h 45m"
  }
};

const Presenca = () => {
  const { user, loading } = useAuth();
  useActivityMonitor();

  // Proteção de autenticação - movida para após todos os hooks
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
                <Button className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockPresenceData.summary.totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Presentes Hoje</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{mockPresenceData.summary.presentToday}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((mockPresenceData.summary.presentToday / mockPresenceData.summary.totalEmployees) * 100)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ausentes Hoje</CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{mockPresenceData.summary.absentToday}</div>
                  <p className="text-xs text-muted-foreground">Não fizeram login</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio Online</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockPresenceData.summary.averageOnlineTime}</div>
                  <p className="text-xs text-muted-foreground">Por funcionário hoje</p>
                </CardContent>
              </Card>
            </div>

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
                      {mockPresenceData.dailyAttendance.map((employee) => (
                        <tr key={employee.name} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{employee.name}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {employee.team}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              employee.status === 'Online' ? 'bg-green-100 text-green-800' :
                              employee.status === 'Ativo' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{employee.loginTime}</td>
                          <td className="py-3 px-4 text-gray-600">{employee.logoutTime}</td>
                          <td className="py-3 px-4 font-medium text-green-600">{employee.totalOnlineTime}</td>
                          <td className="py-3 px-4 text-center">
                            {employee.inactivityCount > 0 ? (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                {employee.inactivityCount}
                              </span>
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

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Semanal de Presença</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-green-700">Taxa de Presença</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">7h 52m</div>
                    <div className="text-sm text-blue-700">Média Diária</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">12</div>
                    <div className="text-sm text-yellow-700">Inatividades Totais</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Presenca;
