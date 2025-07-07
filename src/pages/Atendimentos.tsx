
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";

const mockData = [
  { id: 1, lead: "Maria Silva", hora: "09:15", atendente: "Ana Santos", equipe: "Vendas", duracao: "15m", status: "Concluído" },
  { id: 2, lead: "João Costa", hora: "10:30", atendente: "Carlos Lima", equipe: "Suporte", duracao: "8m", status: "Em andamento" },
  { id: 3, lead: "Ana Oliveira", hora: "11:45", atendente: "Bruna Reis", equipe: "Comercial", duracao: "22m", status: "Concluído" },
  { id: 4, lead: "Pedro Santos", hora: "14:20", atendente: "Diego Alves", equipe: "Vendas", duracao: "12m", status: "Pendente" },
];

const Atendimentos = () => {
  const { user, loading } = useAuth();

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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatório de Atendimentos</h1>
                <p className="text-gray-600">Visualize todos os atendimentos do dia</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar por nome..." className="pl-9" />
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ana">Ana Santos</SelectItem>
                      <SelectItem value="carlos">Carlos Lima</SelectItem>
                      <SelectItem value="bruna">Bruna Reis</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="andamento">Em andamento</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nome do Lead</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Hora</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Atendente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Duração</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{item.lead}</td>
                          <td className="py-3 px-4 text-gray-600">{item.hora}</td>
                          <td className="py-3 px-4 text-gray-600">{item.atendente}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {item.equipe}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.duracao}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                              item.status === 'Em andamento' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
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

export default Atendimentos;
