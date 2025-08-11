
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { ProductivityChart } from "@/components/charts/ProductivityChart";
import { TeamChart } from "@/components/charts/TeamChart";
import { Users, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Dashboard = () => {
  // Buscar métricas reais do sistema
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });



  // Estado de loading apenas enquanto carregando pela primeira vez
  if (metricsLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-80 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Se houver erro, mostrar os dados com valores padrão
  const safeMetrics = metrics || {
    totalAttendances: 0,
    activeAgents: 0,
    pendingCertifications: 0,
    completionRate: "0%",
    trends: {
      totalTrend: "+0%",
      agentsTrend: "+0",
      certificationsTrend: "0",
      rateTrend: "+0%"
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Atendimentos"
          value={safeMetrics.totalAttendances.toLocaleString()}
          icon={MessageSquare}
          trend={safeMetrics.trends.totalTrend}
          trendUp={safeMetrics.trends.totalTrend.includes('+')}
        />
        <MetricCard
          title="Atendentes Ativos"
          value={safeMetrics.activeAgents.toString()}
          icon={Users}
          trend={safeMetrics.trends.agentsTrend}
          trendUp={safeMetrics.trends.agentsTrend.includes('+')}
        />
        <MetricCard
          title="Certificações Pendentes"
          value={safeMetrics.pendingCertifications.toString()}
          icon={FileText}
          trend={safeMetrics.trends.certificationsTrend}
          trendUp={!safeMetrics.trends.certificationsTrend.includes('-')}
        />
        <MetricCard
          title="Taxa de Conclusão"
          value={safeMetrics.completionRate}
          icon={TrendingUp}
          trend={safeMetrics.trends.rateTrend}
          trendUp={safeMetrics.trends.rateTrend.includes('+')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtividade por Atendente</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductivityChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamChart />
        </CardContent>
      </Card>
    </div>
  );
};
