import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Settings, BookOpen, Users, Building, Shield } from "lucide-react";

const LoginHub = () => {
  const navigate = useNavigate();

  const loginOptions = [
    {
      id: "admin",
      title: "Portal Administrativo",
      description: "Gestão completa do sistema, relatórios e configurações",
      icon: Shield,
      route: "/admin/login",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700"
    },
    {
      id: "student",
      title: "Portal do Aluno",
      description: "Acesse seus cursos, avaliações e certificados",
      icon: GraduationCap,
      route: "/portal-aluno/login",
      gradient: "from-green-500 to-green-600",
      hoverGradient: "from-green-600 to-green-700"
    },
    {
      id: "professor",
      title: "Portal do Professor",
      description: "Gerencie disciplinas, conteúdos e avaliações",
      icon: BookOpen,
      route: "/professor/login",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-600 to-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white rounded-full shadow-lg">
              <Building className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">ERP EdunexIA</h1>
          <p className="text-xl text-gray-600">Sistema de Relatórios e Gamificação</p>
          <p className="text-lg text-gray-500 mt-2">Escolha sua área de acesso</p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {loginOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={option.id}
                className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-white/80 backdrop-blur-sm" 
                onClick={() => navigate(option.route)}
              >
                <CardHeader className="text-center pb-6 pt-8">
                  <div className="flex justify-center mb-6">
                    <div className={`p-6 bg-gradient-to-br ${option.gradient} rounded-2xl shadow-lg`}>
                      <IconComponent className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <Button 
                    size="lg" 
                    className={`w-full h-12 bg-gradient-to-r ${option.gradient} hover:${option.hoverGradient} text-white font-semibold text-lg shadow-lg transition-all duration-200`}
                  >
                    Acessar Portal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Sistema integrado de gestão educacional
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginHub;