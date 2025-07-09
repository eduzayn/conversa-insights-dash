import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
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
  BookMarked
} from "lucide-react";

const sidebarItems = [
  {
    title: "Meus Cursos",
    icon: BookOpen,
    href: "/portal/cursos"
  },
  {
    title: "Minhas Disciplinas",
    icon: BookMarked,
    href: "/portal/disciplinas"
  },
  {
    title: "Minhas Avaliações",
    icon: ClipboardList,
    href: "/portal/avaliacoes"
  },
  {
    title: "Certificados",
    icon: Award,
    href: "/portal/certificados"
  },
  {
    title: "Suporte e Chat",
    icon: MessageCircle,
    href: "/portal/suporte"
  },
  {
    title: "Pagamentos",
    icon: CreditCard,
    href: "/portal/pagamentos"
  },
  {
    title: "Documentos",
    icon: FileText,
    href: "/portal/documentos"
  },
  {
    title: "Perfil do Aluno",
    icon: User,
    href: "/portal/perfil"
  },
  {
    title: "Carteirinha",
    icon: IdCard,
    href: "/portal/carteirinha"
  }
];

interface StudentSidebarProps {
  studentData: {
    name: string;
    email: string;
  };
}

export function StudentSidebar({ studentData }: StudentSidebarProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_data');
    setLocation('/portal-aluno/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold">Portal do Aluno</h1>
          <p className="text-xs text-gray-500">Instituto Educacional</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            {studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{studentData.name}</p>
            <p className="text-xs text-gray-500">{studentData.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}