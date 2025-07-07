
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { day: "Seg", attendances: 45 },
  { day: "Ter", attendances: 52 },
  { day: "Qua", attendances: 48 },
  { day: "Qui", attendances: 61 },
  { day: "Sex", attendances: 55 },
  { day: "Sáb", attendances: 32 },
  { day: "Dom", attendances: 28 },
];

export const AttendanceChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
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
