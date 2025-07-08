
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const data = [
  { team: "Vendas", attendances: 156, completed: 142 },
  { team: "Suporte", attendances: 89, completed: 84 },
  { team: "Financeiro", attendances: 45, completed: 43 },
  { team: "Comercial", attendances: 78, completed: 71 },
];

export const TeamChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="team" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="attendances" fill="#3B82F6" name="Total" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" fill="#10B981" name="Concluídos" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
