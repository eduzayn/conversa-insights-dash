
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { ProductivityChart } from "@/components/charts/ProductivityChart";
import { TeamChart } from "@/components/charts/TeamChart";
import { Users, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const AdminDashboard = () => {
  // Buscar métricas reais do sistema
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/dashboard/metrics');
        // Garantir que a resposta tenha a estrutura esperada
        return response || {
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
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return {
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
      }
    }
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

  // Definir dados padrão seguros para evitar erros de TypeScript
  const defaultMetrics = {
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

  const safeMetrics = metrics || defaultMetrics;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Atendimentos"
          value={String(safeMetrics.totalAttendances || 0)}
          icon={MessageSquare}
          trend={safeMetrics.trends?.totalTrend || "+0%"}
          trendUp={(safeMetrics.trends?.totalTrend || "+0%").includes('+')}
        />
        <MetricCard
          title="Atendentes Ativos"
          value={String(safeMetrics.activeAgents || 0)}
          icon={Users}
          trend={safeMetrics.trends?.agentsTrend || "+0"}
          trendUp={(safeMetrics.trends?.agentsTrend || "+0").includes('+')}
        />
        <MetricCard
          title="Certificações Pendentes"
          value={String(safeMetrics.pendingCertifications || 0)}
          icon={FileText}
          trend={safeMetrics.trends?.certificationsTrend || "0"}
          trendUp={!(safeMetrics.trends?.certificationsTrend || "0").includes('-')}
        />
        <MetricCard
          title="Taxa de Conclusão"
          value={String(safeMetrics.completionRate || "0%")}
          icon={TrendingUp}
          trend={safeMetrics.trends?.rateTrend || "+0%"}
          trendUp={(safeMetrics.trends?.rateTrend || "+0%").includes('+')}
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
