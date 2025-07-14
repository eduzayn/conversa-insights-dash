
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy, Coins, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const MetasSummaryCards = () => {
  const { data: goals = [] } = useQuery({
    queryKey: ['/api/goals'],
    enabled: true
  });

  const { data: goalProgress = [] } = useQuery({
    queryKey: ['/api/goal-progress'],
    enabled: true
  });

  // Calcular estatísticas dos dados reais
  const activeGoals = goals.filter((g: any) => g.isActive).length;
  const completedGoals = goalProgress.filter((p: any) => p.achieved).length;
  const totalCoins = goalProgress
    .filter((p: any) => p.achieved)
    .reduce((sum: number, p: any) => {
      const goal = goals.find((g: any) => g.id === p.goalId);
      return sum + (goal?.reward || 0);
    }, 0);
  
  const engagementRate = goals.length > 0 
    ? Math.round((completedGoals / goals.length) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeGoals}</div>
          <p className="text-xs text-muted-foreground">
            {activeGoals === 0 ? "Configure suas primeiras metas" : `${activeGoals} metas configuradas`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedGoals}</div>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Moedas Distribuídas</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">🪙 {totalCoins.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
          <Medal className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{engagementRate}%</div>
          <p className="text-xs text-muted-foreground">
            {goals.length === 0 ? "Aguardando metas" : "Taxa de conclusão"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
