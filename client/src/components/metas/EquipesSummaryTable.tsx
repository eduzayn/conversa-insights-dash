
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Target } from "lucide-react";

export const EquipesSummaryTable = () => {
  const equipesData = [
    {
      equipe: "Comercial",
      metaMes: "50 vendas",
      progresso: 38,
      total: 50,
      moedasGanhas: 570,
      status: "Em andamento"
    },
    {
      equipe: "Suporte",
      metaMes: "200 atendimentos",
      progresso: 195,
      total: 200,
      moedasGanhas: 780,
      status: "Quase lá!"
    },
    {
      equipe: "Administrativo",
      metaMes: "15 processos",
      progresso: 15,
      total: 15,
      moedasGanhas: 300,
      status: "Concluída"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluída": return "bg-green-100 text-green-800";
      case "Quase lá!": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Resumo por Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipe</TableHead>
              <TableHead>Meta do Mês</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Moedas Ganhas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipesData.map((equipe) => (
              <TableRow key={equipe.equipe}>
                <TableCell className="font-medium">{equipe.equipe}</TableCell>
                <TableCell>{equipe.metaMes}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{equipe.progresso}/{equipe.total}</span>
                      <span>{Math.round((equipe.progresso / equipe.total) * 100)}%</span>
                    </div>
                    <Progress value={(equipe.progresso / equipe.total) * 100} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>🪙 {equipe.moedasGanhas}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(equipe.status)}>
                    {equipe.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
