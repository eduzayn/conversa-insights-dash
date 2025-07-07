
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const data = [
  { 
    team: "Vendas", 
    atendimentos: 156, 
    mediaAtendente: 31.2, 
    tempoMedioOnline: 8.25,
    atendentesAtivos: 5 
  },
  { 
    team: "Suporte", 
    atendimentos: 89, 
    mediaAtendente: 29.7, 
    tempoMedioOnline: 8.08,
    atendentesAtivos: 3 
  },
  { 
    team: "Comercial", 
    atendimentos: 78, 
    mediaAtendente: 19.5, 
    tempoMedioOnline: 7.75,
    atendentesAtivos: 4 
  },
  { 
    team: "Financeiro", 
    atendimentos: 45, 
    mediaAtendente: 22.5, 
    tempoMedioOnline: 7.5,
    atendentesAtivos: 2 
  }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{`Equipe: ${label}`}</p>
        <p className="text-sm text-gray-600">{`Atendentes Ativos: ${data.atendentesAtivos}`}</p>
        <p className="text-sm text-gray-600">{`Total Atendimentos: ${data.atendimentos}`}</p>
        <p className="text-sm text-gray-600">{`Média por Atendente: ${data.mediaAtendente}`}</p>
        <p className="text-sm text-gray-600">{`Tempo Médio Online: ${data.tempoMedioOnline}h`}</p>
      </div>
    );
  }
  return null;
};

export const TeamProductivityChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
