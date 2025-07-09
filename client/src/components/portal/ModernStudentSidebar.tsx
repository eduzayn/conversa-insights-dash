import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Home,
  BookOpen, 
  ClipboardList, 
  Award, 
  MessageCircle, 
  CreditCard, 
  FileText, 
  User, 
  IdCard,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Settings
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/portal-aluno",
    isMain: true
  },
  {
    title: "Meus Cursos",
    icon: BookOpen,
    href: "/portal/cursos"
  },
  {
    title: "Avaliações & Tarefas",
    icon: ClipboardList,
    href: "/portal/avaliacoes"
  },
  {
    title: "Financeiro",
    icon: CreditCard,
    href: "/portal/pagamentos"
  },
  {
    title: "Documentos",
    icon: FileText,
    href: "/portal/documentos"
  },
  {
    title: "Certificados",
    icon: Award,
    href: "/portal/certificados"
  },
  {
    title: "Carteirinha Estudantil",
    icon: IdCard,
    href: "/portal/carteirinha"
  },
  {
    title: "Suporte",
    icon: MessageCircle,
    href: "/portal/suporte"
  },
  {
    title: "Meu Perfil",
    icon: User,
    href: "/portal/perfil"
  }
];

interface StudentData {
  name: string;
  email: string;
  cpf: string;
  matriculaAtiva: boolean;
}

interface ModernStudentSidebarProps {
  studentData: StudentData;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function ModernStudentSidebar({ studentData, collapsed, onToggleCollapse }: ModernStudentSidebarProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_data');
    setLocation('/portal-aluno/login');
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className={cn("flex items-center space-x-3", collapsed && "justify-center")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">Portal Zayn</h1>
              <p className="text-xs text-gray-500">Instituto Educacional</p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Student Info */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-blue-200">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold">
                {studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{studentData.name}</p>
              <p className="text-xs text-gray-600 truncate">{studentData.email}</p>
              <div className="flex items-center space-x-1 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  studentData.matriculaAtiva ? "bg-green-500" : "bg-red-500"
                )}></div>
                <span className="text-xs text-gray-500">
                  {studentData.matriculaAtiva ? "Matrícula Ativa" : "Matrícula Inativa"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isMain ? 
              location === '/portal-aluno' : 
              location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full h-11 transition-all duration-200",
                    collapsed ? "px-0 justify-center" : "justify-start px-3",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.title}</span>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200"></div>

        {/* Settings and Logout */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              collapsed ? "px-0 justify-center" : "justify-start px-3"
            )}
          >
            <Settings className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span className="text-sm font-medium">Configurações</span>}
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full h-11 text-red-600 hover:text-red-700 hover:bg-red-50",
              collapsed ? "px-0 justify-center" : "justify-start px-3"
            )}
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span className="text-sm font-medium">Sair</span>}
          </Button>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">Versão 2.0</p>
            <p className="text-xs text-gray-400">© 2025 Grupo Zayn</p>
          </div>
        </div>
      )}
    </div>
  );
}