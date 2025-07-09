import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Relatorios() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-2">Relatórios de desempenho dos alunos por turma, curso e disciplina</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Desempenho</CardTitle>
          <CardDescription>Análises detalhadas do progresso dos alunos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Sistema em desenvolvimento</h3>
            <p>A funcionalidade de relatórios será implementada em breve</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}