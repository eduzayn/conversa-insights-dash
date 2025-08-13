import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  MessageSquare, 
  GraduationCap, 
  DollarSign,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuSections = [
  {
    label: 'Geral',
    icon: BarChart3,
    iconColor: 'text-blue-600',
    items: [
      { label: 'Dashboard', path: '/' },
      { label: 'Produtividade', path: '/produtividade' },
      { label: 'Presença', path: '/presenca' },
      { label: 'Metas & Engajamento', path: '/metas' },
    ]
  },
  {
    label: 'Relacionamento',
    icon: MessageSquare,
    iconColor: 'text-green-600',
    items: [
      { label: 'Atendimento ao Aluno', path: '/atendimento-aluno' },
      { label: 'Chat Interno', path: '/chat-interno' },
      { label: 'CRM', path: '/crm' },
      { label: 'Diário de Atendimento', path: '/atendimentos' },
    ]
  },
  {
    label: 'Acadêmico',
    icon: GraduationCap,
    iconColor: 'text-purple-600',
    items: [
      { label: 'Análise Certificação', path: '/admin/certificacoes' },
      { label: 'Certificações FADYC', path: '/admin/reports/certificacoes-fadyc' },
      { label: 'Certificados Acadêmicos', path: '/certificados-pos' },
      { label: 'Gestão de Cursos', path: '/matrizes-curriculares' },
      { label: 'Envios UNICV', path: '/envios-unicv' },
      { label: 'Envios FAMAR', path: '/envios-famar' },
    ]
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    iconColor: 'text-amber-600',
    items: [
      { label: 'Matrícula Simplificada', path: '/matricula-simplificada' },
      { label: 'Asaas União', path: '/cobrancas' },
      { label: 'Negociações', path: '/negociacoes' },
    ]
  },
  {
    label: 'Integrações',
    icon: Settings,
    iconColor: 'text-gray-600',
    items: [

      { label: 'Integração Asaas', path: '/integracao-asaas' },
      { label: 'Gerenciar Tokens', path: '/gerenciar-tokens' },
      { label: 'Gerenciamento Roteamento', path: '/gerenciamento-roteamento' },
    ]
  }
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { logout } = useAuth();

  // Limpa estado anterior e inicializa submenus colapsados
  useEffect(() => {
    // Garante que todas as seções iniciem colapsadas
    setExpandedSections([]);
    // Limpa qualquer estado anterior salvo
    localStorage.removeItem('sidebar-expanded-sections');
  }, []);

  const handleBotConversaAccess = () => {
    window.open("https://app.botconversa.com.br/login/", "_blank");
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const toggleSection = (sectionLabel: string) => {
    if (collapsed && !mobileOpen) return; // Não permite expandir/contrair quando sidebar está colapsada
    
    setExpandedSections(prev => {
      const newExpandedSections = prev.includes(sectionLabel) 
        ? prev.filter(s => s !== sectionLabel)
        : [...prev, sectionLabel];
      
      // Salva estado no localStorage para manter preferências do usuário
      localStorage.setItem('sidebar-expanded-sections', JSON.stringify(newExpandedSections));
      
      return newExpandedSections;
    });
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
              <h1 className="text-lg md:text-xl font-bold text-gray-900">EdunexIA</h1>
              <p className="text-xs md:text-sm text-gray-500">Grupo ZAYN</p>
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

        {/* BotConversa Access Button - Temporariamente oculto */}
        {/* <div className="p-4">
          <Button
            onClick={handleBotConversaAccess}
            className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
            size={collapsed && !mobileOpen ? "sm" : "default"}
          >
            <ExternalLink className="h-4 w-4" />
            {(!collapsed || mobileOpen) && <span className="ml-2">Acessar BotConversa</span>}
          </Button>
        </div> */}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuSections.map((section) => (
            <div key={section.label} className="space-y-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg transition-colors min-h-[44px] group",
                  "hover:bg-gray-100 active:bg-gray-200 text-gray-700 font-medium",
                  collapsed && !mobileOpen ? "justify-center" : ""
                )}
                title={collapsed && !mobileOpen ? section.label : undefined}
              >
                <div className="flex items-center">
                  <section.icon className={cn("h-5 w-5 flex-shrink-0", section.iconColor)} />
                  {(!collapsed || mobileOpen) && (
                    <span className="ml-3">{section.label}</span>
                  )}
                </div>
                {(!collapsed || mobileOpen) && (
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                    {expandedSections.includes(section.label) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                )}
              </button>

              {/* Section Items */}
              {(expandedSections.includes(section.label) || (collapsed && !mobileOpen)) && (
                <div className={cn(
                  "space-y-1",
                  collapsed && !mobileOpen ? "hidden" : "pl-8"
                )}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center p-2 rounded-lg transition-colors min-h-[40px] text-sm",
                          "hover:bg-gray-100 active:bg-gray-200",
                          isActive ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-600"
                        )
                      }
                    >
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full flex items-center justify-start gap-3 p-3 rounded-lg transition-colors min-h-[44px]",
              "text-red-600 hover:text-red-700 hover:bg-red-50",
              collapsed && !mobileOpen ? "justify-center" : ""
            )}
            title={collapsed && !mobileOpen ? "Sair" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(!collapsed || mobileOpen) && (
              <span className="font-medium">Sair</span>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};