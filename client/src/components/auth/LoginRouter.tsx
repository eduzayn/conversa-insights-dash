import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Settings, BookOpen, Shield } from "lucide-react";

export default function LoginRouter() {
  const navigate = useNavigate();

  const loginOptions = [
    {
      id: "admin",
      title: "Portal Administrativo", 
      description: "Gestão completa do sistema, relatórios e configurações",
      icon: Shield,
      route: "/admin/login",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "student",
      title: "Portal do Aluno",
      description: "Acesse seus cursos, avaliações e certificados", 
      icon: GraduationCap,
      route: "/portal-aluno/login",
      gradient: "from-green-500 to-green-600"
    },
    {
      id: "professor",
      title: "Portal do Professor",
      description: "Gerencie disciplinas, conteúdos e avaliações",
      icon: BookOpen, 
      route: "/professor/login",
      gradient: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Portal Educacional</h1>
          <p className="text-xl text-gray-600">Escolha sua área de acesso</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {loginOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={option.id}
                className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer" 
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
                    className={`w-full h-12 bg-gradient-to-r ${option.gradient} hover:opacity-90 text-white font-semibold text-lg shadow-lg`}
                  >
                    Acessar Portal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}