
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  MessageCircle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Target,
  MessagesSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Users, label: "Atendimentos", path: "/atendimentos" },
  { icon: TrendingUp, label: "Produtividade", path: "/produtividade" },
  { icon: Clock, label: "Presença", path: "/presenca" },
  { icon: Target, label: "Metas & Engajamento", path: "/metas" },
  { icon: MessageCircle, label: "Chat ao Vivo", path: "/chat" },
  { icon: MessagesSquare, label: "Chat Interno", path: "/chat-interno" },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleBotConversaAccess = () => {
    window.open("https://app.botconversa.com.br/login/", "_blank");
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Educhat</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* BotConversa Access Button */}
      <div className="p-4">
        <Button
          onClick={handleBotConversaAccess}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size={collapsed ? "sm" : "default"}
        >
          <ExternalLink className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Acessar BotConversa</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center p-3 rounded-lg transition-colors",
                "hover:bg-gray-100",
                isActive ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-700"
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
