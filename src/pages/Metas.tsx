import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Target, Trophy, Coins, Gift, Plus, Medal, Bell } from "lucide-react";
import { ConfigurarMetasModal } from "@/components/ConfigurarMetasModal";
import { RecompensasModal } from "@/components/RecompensasModal";
import { MetaConquistada } from "@/components/MetaConquistada";
import { useMetaNotificacoes } from "@/hooks/useMetaNotificacoes";
import { toast } from "sonner";

const Metas = () => {
  const [isMetasModalOpen, setIsMetasModalOpen] = useState(false);
  const [isRecompensasModalOpen, setIsRecompensasModalOpen] = useState(false);
  
  const { 
    conquistaAtual, 
    isVisible, 
    fecharNotificacao, 
    simularConquista 
  } = useMetaNotificacoes();

  const equipesData = [
    {
      equipe: "Comercial",
      metaMes: "50 vendas",
      progresso: 38,
      total: 50,
      moedasGanhas: 570,
      status: "Em andamento"
    },
    {
      equipe: "Suporte",
      metaMes: "200 atendimentos",
      progresso: 195,
      total: 200,
      moedasGanhas: 780,
      status: "Quase lá!"
    },
    {
      equipe: "Administrativo",
      metaMes: "15 processos",
      progresso: 15,
      total: 15,
      moedasGanhas: 300,
      status: "Concluída"
    }
  ];

  const rankingData = [
    { posicao: 1, nome: "Maria Souza", setor: "Comercial", moedas: 680, moedasMes: 120 },
    { posicao: 2, nome: "João Lima", setor: "Suporte", moedas: 530, moedasMes: 95 },
    { posicao: 3, nome: "Ana Santos", setor: "Comercial", moedas: 480, moedasMes: 88 },
    { posicao: 4, nome: "Carlos Silva", setor: "Administrativo", moedas: 420, moedasMes: 75 },
    { posicao: 5, nome: "Bruna Reis", setor: "Suporte", moedas: 380, moedasMes: 62 }
  ];

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${posicao}º`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluída": return "bg-green-100 text-green-800";
      case "Quase lá!": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const handleSimularConquista = (tipo: 'individual' | 'equipe') => {
    simularConquista(tipo);
    toast.success(`Simulando conquista ${tipo}!`, {
      description: "Aguarde a notificação aparecer..."
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Metas & Engajamento</h1>
                <p className="text-gray-600">Sistema de gamificação e acompanhamento de metas</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSimularConquista('individual')}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Simular Individual
                </Button>
                <Button 
                  onClick={() => handleSimularConquista('equipe')}
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Simular Equipe
                </Button>
                <Button 
                  onClick={() => setIsMetasModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Configurar Metas
                </Button>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">3 equipes, 9 individuais</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moedas Distribuídas</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">🪙 2.340</div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
                  <Medal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">+5% vs mês anterior</p>
                </CardContent>
              </Card>
            </div>

            {/* Resumo por Equipe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Resumo por Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Meta do Mês</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Moedas Ganhas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipesData.map((equipe) => (
                      <TableRow key={equipe.equipe}>
                        <TableCell className="font-medium">{equipe.equipe}</TableCell>
                        <TableCell>{equipe.metaMes}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{equipe.progresso}/{equipe.total}</span>
                              <span>{Math.round((equipe.progresso / equipe.total) * 100)}%</span>
                            </div>
                            <Progress value={(equipe.progresso / equipe.total) * 100} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>🪙 {equipe.moedasGanhas}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(equipe.status)}>
                            {equipe.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Ranking Gamificado */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Ranking do Mês
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRecompensasModalOpen(true)}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Ver Recompensas
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Moedas do Mês</TableHead>
                      <TableHead>Total Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingData.map((pessoa) => (
                      <TableRow key={pessoa.posicao}>
                        <TableCell className="font-medium text-lg">
                          {getPosicaoIcon(pessoa.posicao)}
                        </TableCell>
                        <TableCell className="font-medium">{pessoa.nome}</TableCell>
                        <TableCell>{pessoa.setor}</TableCell>
                        <TableCell>🪙 {pessoa.moedasMes}</TableCell>
                        <TableCell className="font-bold">🪙 {pessoa.moedas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ConfigurarMetasModal 
        open={isMetasModalOpen} 
        onOpenChange={setIsMetasModalOpen} 
      />
      <RecompensasModal 
        open={isRecompensasModalOpen} 
        onOpenChange={setIsRecompensasModalOpen} 
      />
      
      {/* Notificação de Meta Conquistada */}
      {conquistaAtual && (
        <MetaConquistada
          isVisible={isVisible}
          onClose={fecharNotificacao}
          conquista={conquistaAtual}
        />
      )}
    </div>
  );
};

export default Metas;
