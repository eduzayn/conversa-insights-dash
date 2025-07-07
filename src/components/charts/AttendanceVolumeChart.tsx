
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const data = [
  { day: "Seg", Ana: 23, Carlos: 19, Bruna: 27, Diego: 15, Elena: 31 },
  { day: "Ter", Ana: 25, Carlos: 21, Bruna: 24, Diego: 18, Elena: 29 },
  { day: "Qua", Ana: 22, Carlos: 17, Bruna: 26, Diego: 16, Elena: 33 },
  { day: "Qui", Ana: 28, Carlos: 23, Bruna: 25, Diego: 19, Elena: 28 },
  { day: "Sex", Ana: 26, Carlos: 20, Bruna: 29, Diego: 21, Elena: 35 },
];

export const AttendanceVolumeChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Ana" stroke="#10B981" strokeWidth={2} />
        <Line type="monotone" dataKey="Carlos" stroke="#3B82F6" strokeWidth={2} />
        <Line type="monotone" dataKey="Bruna" stroke="#F59E0B" strokeWidth={2} />
        <Line type="monotone" dataKey="Diego" stroke="#EF4444" strokeWidth={2} />
        <Line type="monotone" dataKey="Elena" stroke="#8B5CF6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};
