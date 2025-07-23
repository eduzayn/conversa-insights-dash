
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";

export const ProductivityChart = () => {
  // Buscar dados reais dos gráficos
  const { data: chartsData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/charts"],
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  if (isLoading || !chartsData) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const data = chartsData.productivityByAgent || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="agent" />
        <YAxis />
        <Tooltip 
          labelFormatter={(label) => `Atendente: ${label}`}
          formatter={(value, name, props) => [value, "Atendimentos", props.payload.fullName]}
        />
        <Bar dataKey="attendances" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
