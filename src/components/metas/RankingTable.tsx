
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trophy, Gift } from "lucide-react";

interface RankingTableProps {
  onVerRecompensas: () => void;
}

export const RankingTable = ({ onVerRecompensas }: RankingTableProps) => {
  const rankingData = [
    { posicao: 1, nome: "Maria Souza", setor: "Comercial", moedas: 680, moedasMes: 120 },
    { posicao: 2, nome: "João Lima", setor: "Suporte", moedas: 530, moedasMes: 95 },
    { posicao: 3, nome: "Ana Santos", setor: "Comercial", moedas: 480, moedasMes: 88 },
    { posicao: 4, nome: "Carlos Silva", setor: "Administrativo", moedas: 420, moedasMes: 75 },
    { posicao: 5, nome: "Bruna Reis", setor: "Suporte", moedas: 380, moedasMes: 62 }
  ];

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `${posicao}º`;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranking do Mês
        </CardTitle>
        <Button 
          variant="outline" 
          onClick={onVerRecompensas}
        >
          <Gift className="h-4 w-4 mr-2" />
          Ver Recompensas
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Moedas do Mês</TableHead>
              <TableHead>Total Acumulado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankingData.map((pessoa) => (
              <TableRow key={pessoa.posicao}>
                <TableCell className="font-medium text-lg">
                  {getPosicaoIcon(pessoa.posicao)}
                </TableCell>
                <TableCell className="font-medium">{pessoa.nome}</TableCell>
                <TableCell>{pessoa.setor}</TableCell>
                <TableCell>🪙 {pessoa.moedasMes}</TableCell>
                <TableCell className="font-bold">🪙 {pessoa.moedas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
