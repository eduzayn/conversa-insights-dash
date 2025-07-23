
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

export const AttendanceVolumeChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['productivity-charts'],
    queryFn: () => apiRequest('/api/productivity/charts'),
    staleTime: 2 * 60 * 1000 // 2 minutos
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Carregando dados dos atendimentos...</div>
      </div>
    );
  }

  const volumeData = chartData?.volumeData || [];
  
  // Obter nomes dos atendentes para as linhas do gráfico
  const attendants = volumeData.length > 0 ? 
    Object.keys(volumeData[0]).filter(key => key !== 'day' && key !== 'date') : [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={volumeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip 
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              const data = payload[0].payload;
              return `${label} (${data.date})`;
            }
            return label;
          }}
        />
        <Legend />
        {attendants.map((attendant, index) => (
          <Line
            key={attendant}
            type="monotone"
            dataKey={attendant}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            name={attendant}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
