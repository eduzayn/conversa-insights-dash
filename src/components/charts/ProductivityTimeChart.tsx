
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { agent: "Ana", today: 8.75, week: 42.25, month: 168.5 },
  { agent: "Carlos", today: 8.33, week: 39.75, month: 158.33 },
  { agent: "Bruna", today: 8.5, week: 41.5, month: 162.75 },
  { agent: "Diego", today: 7.8, week: 38.2, month: 152.8 },
  { agent: "Elena", today: 8.1, week: 40.1, month: 160.4 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey === 'today' ? 'Hoje' : 
               entry.dataKey === 'week' ? 'Esta Semana' : 'Este Mês'}: ${entry.value}h`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ProductivityTimeChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="agent" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="today" fill="#10B981" name="Hoje" radius={[2, 2, 0, 0]} />
        <Bar dataKey="week" fill="#3B82F6" name="Semana" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
