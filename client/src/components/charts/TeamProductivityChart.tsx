
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{`Equipe: ${label}`}</p>
        <p className="text-sm text-gray-600">{`Atendentes Ativos: ${data.atendentesAtivos}`}</p>
        <p className="text-sm text-gray-600">{`Total Atendimentos: ${data.atendimentos}`}</p>
        <p className="text-sm text-gray-600">{`Média por Atendente: ${data.mediaAtendente}`}</p>
      </div>
    );
  }
  return null;
};

export const TeamProductivityChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['productivity-charts'],
    queryFn: () => apiRequest('/api/productivity/charts'),
    staleTime: 2 * 60 * 1000 // 2 minutos
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Carregando dados das equipes...</div>
      </div>
    );
  }

  const teamData = chartData?.teamData || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={teamData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="team" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          yAxisId="left" 
          dataKey="atendimentos" 
          fill="#10B981" 
          name="Total Atendimentos" 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          yAxisId="right" 
          dataKey="mediaAtendente" 
          fill="#3B82F6" 
          name="Média por Atendente" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
