
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const EquipesSummaryTable = () => {
  const { data: goals = [] } = useQuery({
    queryKey: ['/api/goals'],
    enabled: true
  });

  const { data: goalProgress = [] } = useQuery({
    queryKey: ['/api/goal-progress'],
    enabled: true
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    enabled: true
  });

  // Processar dados reais das equipes
  const equipesData = teams.map((team: any) => {
    const teamGoals = goals.filter((g: any) => g.teamId === team.id && g.isActive);
    const teamProgress = goalProgress.filter((p: any) => {
      const goal = goals.find((g: any) => g.id === p.goalId);
      return goal && goal.teamId === team.id;
    });

    const completedGoals = teamProgress.filter((p: any) => p.achieved).length;
    const totalCoins = teamProgress
      .filter((p: any) => p.achieved)
      .reduce((sum: number, p: any) => {
        const goal = goals.find((g: any) => g.id === p.goalId);
        return sum + (goal?.reward || 0);
      }, 0);

    const progressRate = teamGoals.length > 0 
      ? Math.round((completedGoals / teamGoals.length) * 100)
      : 0;

    let status = "Sem metas";
    if (teamGoals.length > 0) {
      if (progressRate === 100) status = "Concluída";
      else if (progressRate >= 80) status = "Quase lá!";
      else status = "Em andamento";
    }

    return {
      equipe: team.name,
      metaMes: teamGoals.length > 0 ? `${teamGoals.length} metas ativas` : "Nenhuma meta",
      progresso: completedGoals,
      total: teamGoals.length,
      moedasGanhas: totalCoins,
      status
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluída": return "bg-green-100 text-green-800";
      case "Quase lá!": return "bg-yellow-100 text-yellow-800";
      case "Sem metas": return "bg-gray-100 text-gray-600";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
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
            {equipesData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhuma equipe configurada no sistema.
                  <br />
                  Configure equipes e suas metas para acompanhar o desempenho.
                </TableCell>
              </TableRow>
            ) : (
              equipesData.map((equipe) => (
                <TableRow key={equipe.equipe}>
                  <TableCell className="font-medium">{equipe.equipe}</TableCell>
                  <TableCell>{equipe.metaMes}</TableCell>
                  <TableCell>
                    {equipe.total > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{equipe.progresso}/{equipe.total}</span>
                          <span>{Math.round((equipe.progresso / equipe.total) * 100)}%</span>
                        </div>
                        <Progress value={(equipe.progresso / equipe.total) * 100} className="h-2" />
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>🪙 {equipe.moedasGanhas}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(equipe.status)}>
                      {equipe.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
