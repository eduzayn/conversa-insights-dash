
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { ProductivityChart } from "@/components/charts/ProductivityChart";
import { TeamChart } from "@/components/charts/TeamChart";
import { Users, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Dashboard = () => {
  // Buscar métricas reais do sistema
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Estado de loading
  if (metricsLoading || !metrics) {
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

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Atendimentos"
          value={metrics?.totalAttendances?.toLocaleString() || "0"}
          icon={MessageSquare}
          trend={metrics?.trends?.totalTrend || "+0%"}
          trendUp={metrics?.trends?.totalTrend?.includes('+') || false}
        />
        <MetricCard
          title="Atendentes Ativos"
          value={metrics?.activeAgents?.toString() || "0"}
          icon={Users}
          trend={metrics?.trends?.agentsTrend || "+0"}
          trendUp={metrics?.trends?.agentsTrend?.includes('+') || false}
        />
        <MetricCard
          title="Certificações Pendentes"
          value={metrics?.pendingCertifications?.toString() || "0"}
          icon={FileText}
          trend={metrics?.trends?.certificationsTrend || "0"}
          trendUp={!metrics?.trends?.certificationsTrend?.includes('-')}
        />
        <MetricCard
          title="Taxa de Conclusão"
          value={metrics?.completionRate || "0%"}
          icon={TrendingUp}
          trend={metrics?.trends?.rateTrend || "+0%"}
          trendUp={metrics?.trends?.rateTrend?.includes('+') || false}
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
