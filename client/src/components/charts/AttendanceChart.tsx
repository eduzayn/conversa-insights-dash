
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";

export const AttendanceChart = () => {
  // Buscar dados reais dos gráficos
  const { data: chartsData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/charts"],
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  if (isLoading || !chartsData) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = chartsData.attendancesByDay || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip 
          labelFormatter={(label) => `Dia: ${label}`}
          formatter={(value) => [value, "Atendimentos"]}
        />
        <Line 
          type="monotone" 
          dataKey="attendances" 
          stroke="#3B82F6" 
          strokeWidth={3}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
