import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function Submissoes() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submissões dos Alunos</h1>
        <p className="text-gray-600 mt-2">Acompanhe as tarefas e avaliações enviadas pelos alunos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissões Pendentes</CardTitle>
          <CardDescription>Trabalhos e avaliações aguardando correção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Sistema em desenvolvimento</h3>
            <p>A funcionalidade de submissões será implementada em breve</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}