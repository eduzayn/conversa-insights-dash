
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { agent: "Ana", attendances: 23 },
  { agent: "Carlos", attendances: 19 },
  { agent: "Bruna", attendances: 27 },
  { agent: "Diego", attendances: 15 },
  { agent: "Elena", attendances: 31 },
];

export const ProductivityChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="agent" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="attendances" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
