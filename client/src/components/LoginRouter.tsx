import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Settings, BookOpen } from "lucide-react";

export default function LoginRouter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white rounded-full shadow-lg">
              <GraduationCap className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Portal Educacional</h1>
          <p className="text-xl text-gray-600">Escolha sua área de acesso</p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Portal do Aluno */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-white/80 backdrop-blur-sm" 
                onClick={() => navigate('/portal-aluno/login')}>
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <GraduationCap className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-blue-900 mb-2">Portal do Aluno</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Acesse seus cursos, avaliações e certificados
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button size="lg" className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg shadow-lg">
                Entrar como Aluno
              </Button>
            </CardContent>
          </Card>

          {/* Portal do Professor */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
                onClick={() => navigate('/professor/login')}>
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <BookOpen className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-green-900 mb-2">Portal do Professor</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Gerencie disciplinas, conteúdos e avaliações
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button size="lg" className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg shadow-lg">
                Entrar como Professor
              </Button>
            </CardContent>
          </Card>

          {/* Portal Administrativo */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
                onClick={() => navigate('/admin/login')}>
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <Settings className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-purple-900 mb-2">Portal Administrativo</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Acesso para gestão do sistema e relatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button size="lg" className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-lg shadow-lg">
                Entrar como Administrador
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
            <p className="text-gray-700 font-medium">
              Sistema de Gestão Educacional
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Versão 2025 - Desenvolvido com tecnologia moderna
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}