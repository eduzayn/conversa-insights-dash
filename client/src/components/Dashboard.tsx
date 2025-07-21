
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { ProductivityChart } from "@/components/charts/ProductivityChart";
import { TeamChart } from "@/components/charts/TeamChart";
import { Users, MessageSquare, FileText, TrendingUp } from "lucide-react";

export const Dashboard = () => {
  // Mock data - replace with real data from API
  const metrics = {
    totalAttendances: 1247,
    activeAgents: 12,
    pendingCertifications: 534,
    completionRate: "94%"
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Atendimentos"
          value={metrics.totalAttendances.toLocaleString()}
          icon={MessageSquare}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="Atendentes Ativos"
          value={metrics.activeAgents.toString()}
          icon={Users}
          trend="+2"
          trendUp={true}
        />
        <MetricCard
          title="Certificações Pendentes"
          value={metrics.pendingCertifications.toString()}
          icon={FileText}
          trend="-15"
          trendUp={false}
        />
        <MetricCard
          title="Taxa de Conclusão"
          value={metrics.completionRate}
          icon={TrendingUp}
          trend="+3%"
          trendUp={true}
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
