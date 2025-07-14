
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trophy, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface RankingTableProps {
  onVerRecompensas: () => void;
}

export const RankingTable = ({ onVerRecompensas }: RankingTableProps) => {
  const { data: goals = [] } = useQuery({
    queryKey: ['/api/goals'],
    enabled: true
  });

  const { data: goalProgress = [] } = useQuery({
    queryKey: ['/api/goal-progress'],
    enabled: true
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: true
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    enabled: true
  });

  // Processar dados reais do ranking
  const rankingData = users
    .map((user: any) => {
      const userProgress = goalProgress.filter((p: any) => p.userId === user.id && p.achieved);
      const totalCoins = userProgress.reduce((sum: number, p: any) => {
        const goal = goals.find((g: any) => g.id === p.goalId);
        return sum + (goal?.reward || 0);
      }, 0);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyCoins = userProgress
        .filter((p: any) => p.updatedAt && p.updatedAt.startsWith(currentMonth))
        .reduce((sum: number, p: any) => {
          const goal = goals.find((g: any) => g.id === p.goalId);
          return sum + (goal?.reward || 0);
        }, 0);

      const userTeam = teams.find((t: any) => t.id === user.teamId);

      return {
        nome: user.name || user.username,
        setor: userTeam?.name || "Sem equipe",
        moedas: totalCoins,
        moedasMes: monthlyCoins,
        userId: user.id
      };
    })
    .filter((user: any) => user.moedas > 0)
    .sort((a: any, b: any) => b.moedas - a.moedas)
    .map((user: any, index: number) => ({
      ...user,
      posicao: index + 1
    }))
    .slice(0, 10);

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${posicao}º`;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranking do Mês
        </CardTitle>
        <Button 
          variant="outline" 
          onClick={onVerRecompensas}
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
            {rankingData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhum colaborador com metas conquistadas ainda.
                  <br />
                  Configure metas e acompanhe o progresso da equipe.
                </TableCell>
              </TableRow>
            ) : (
              rankingData.map((pessoa) => (
                <TableRow key={pessoa.posicao}>
                  <TableCell className="font-medium text-lg">
                    {getPosicaoIcon(pessoa.posicao)}
                  </TableCell>
                  <TableCell className="font-medium">{pessoa.nome}</TableCell>
                  <TableCell>{pessoa.setor}</TableCell>
                  <TableCell>🪙 {pessoa.moedasMes}</TableCell>
                  <TableCell className="font-bold">🪙 {pessoa.moedas}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
