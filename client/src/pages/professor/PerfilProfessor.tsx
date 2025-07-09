import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Save } from "lucide-react";

export default function PerfilProfessor() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600 mt-2">Gerencie suas informações pessoais e acadêmicas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Dados básicos e de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" defaultValue="Prof. João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Institucional</Label>
                <Input id="email" type="email" defaultValue="joao.silva@instituicao.edu.br" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" defaultValue="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Input id="departamento" defaultValue="Ciência da Computação" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea 
                id="bio" 
                rows={4}
                defaultValue="Professor de Ciência da Computação com experiência em algoritmos e estruturas de dados."
              />
            </div>

            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
              <Button variant="outline" size="sm">
                Alterar Foto
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Disciplinas</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Alunos</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conteúdos</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avaliações</span>
                <span className="font-medium">8</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}