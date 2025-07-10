
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Target,
  MessagesSquare,
  UserCheck,
  Menu,
  X,
  Kanban,
  Settings,
  Award,
  CreditCard,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: UserCheck, label: "Atendimento ao Aluno", path: "/atendimento-aluno" },
  { icon: MessagesSquare, label: "Chat Interno", path: "/chat-interno" },
  { icon: Kanban, label: "CRM", path: "/crm" },
  { icon: Award, label: "Certificações", path: "/certificacoes" },
  { icon: Users, label: "Atendimentos", path: "/atendimentos" },
  { icon: TrendingUp, label: "Produtividade", path: "/produtividade" },
  { icon: Clock, label: "Presença", path: "/presenca" },
  { icon: Target, label: "Metas & Engajamento", path: "/metas" },
  { icon: Settings, label: "Integração BotConversa", path: "/integracao-botconversa" },

  { icon: UserPlus, label: "Matrícula Simplificada", path: "/matricula-simplificada" },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleBotConversaAccess = () => {
    window.open("https://app.botconversa.com.br/login/", "_blank");
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 p-0"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40",
        // Mobile styles
        "md:relative fixed inset-y-0 left-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Desktop styles
        collapsed ? "md:w-16 w-64" : "md:w-64 w-64"
      )}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {(!collapsed || mobileOpen) && (
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Analytics</h1>
              <p className="text-xs md:text-sm text-gray-500">Educhat</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* BotConversa Access Button */}
        <div className="p-4">
          <Button
            onClick={handleBotConversaAccess}
            className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
            size={collapsed && !mobileOpen ? "sm" : "default"}
          >
            <ExternalLink className="h-4 w-4" />
            {(!collapsed || mobileOpen) && <span className="ml-2">Acessar BotConversa</span>}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  "flex items-center p-3 rounded-lg transition-colors min-h-[44px]",
                  "hover:bg-gray-100 active:bg-gray-200",
                  isActive ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-700"
                )
              }
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="ml-3 font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};
