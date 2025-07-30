import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  FileText, 
  ClipboardList, 
  BarChart3, 
  User,
  LogOut,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfessorData {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface ProfessorSidebarProps {
  professorData: ProfessorData;
}

export function ProfessorSidebar({ professorData }: ProfessorSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Painel Geral",
      path: "/professor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Disciplinas",
      path: "/professor/disciplinas",
      icon: BookOpen,
    },
    {
      label: "Aulas e Conteúdos",
      path: "/professor/conteudos",
      icon: Video,
    },
    {
      label: "Avaliações e Simulados",
      path: "/professor/avaliacoes",
      icon: FileText,
    },
    {
      label: "Submissões dos Alunos",
      path: "/professor/submissoes",
      icon: ClipboardList,
    },
    {
      label: "Relatórios",
      path: "/professor/relatorios",
      icon: BarChart3,
    },
    {
      label: "Perfil",
      path: "/professor/perfil",
      icon: User,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('professor_data');
    navigate('/professor/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Portal do Professor</h1>
            <p className="text-sm text-gray-600">Área de Ensino</p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
              {getInitials(professorData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {professorData.name}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {professorData.role === 'professor' ? 'Professor' : 
               professorData.role === 'conteudista' ? 'Conteudista' : 'Coordenador'}
            </p>
            {professorData.department && (
              <p className="text-xs text-gray-500 truncate">
                {professorData.department}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link to={item.path} className="block">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}