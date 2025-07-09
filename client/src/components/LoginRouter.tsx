import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Settings, BookOpen } from "lucide-react";

export default function LoginRouter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portal Educacional</h1>
          <p className="text-gray-600">Escolha sua área de acesso</p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Portal do Aluno */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" 
                onClick={() => navigate('/portal-aluno/login')}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <GraduationCap className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-blue-900">Portal do Aluno</CardTitle>
              <CardDescription>Acesse seus cursos, avaliações e certificados</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Entrar como Aluno
              </Button>
            </CardContent>
          </Card>

          {/* Portal do Professor */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate('/professor/login')}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <BookOpen className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-green-900">Portal do Professor</CardTitle>
              <CardDescription>Gerencie disciplinas, conteúdos e avaliações</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Entrar como Professor
              </Button>
            </CardContent>
          </Card>

          {/* Portal Administrativo */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate('/admin/login')}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Settings className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-purple-900">Portal Administrativo</CardTitle>
              <CardDescription>Acesso para gestão do sistema e relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Entrar como Administrador
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Sistema de Gestão Educacional - Versão 2025
          </p>
        </div>
      </div>
    </div>
  );
}