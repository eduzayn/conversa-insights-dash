import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Trash2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  performBrowserCleanup, 
  clearCertificationsCache, 
  performFullSystemDiagnostic,
  clearReactQueryCache,
  clearBrowserCache,
  detectCertificationProblems
} from '@/utils/cacheCleanup';

export default function ForceRefreshButton() {
  const location = useLocation();
  const [isClearing, setIsClearing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const { toast } = useToast();

  // Detecta se estamos em páginas administrativas
  const isAdminPage = () => {
    const adminPaths = [
      '/admin', '/atendimentos', '/atendimento-aluno', '/produtividade', 
      '/presenca', '/chat-interno', '/metas', '/crm', '/certificacoes', 
      '/certificados-pos', '/charges', '/cobrancas', '/integracao-asaas', 
      '/gerenciar-tokens', '/negociacoes', '/envios-unicv', '/envios-famar', 
      '/matricula-simplificada', '/matrizes-curriculares', '/gestao-academica'
    ];
    return adminPaths.some(path => location.pathname.startsWith(path));
  };

  // Auto-detecta problemas em produção e verifica se deve mostrar o botão
  useEffect(() => {
    // Só funciona em páginas administrativas
    if (!isAdminPage()) {
      setShouldShow(false);
      return;
    }

    const detectProblems = () => {
      const problems = [];
      
      // Verifica localStorage excessivo
      if (localStorage.length > 20) {
        problems.push('Muitos dados no localStorage');
      }
      
      // Verifica elementos DOM órfãos
      const orphanedElements = document.querySelectorAll('[data-radix-portal], [data-sonner-toaster]').length;
      if (orphanedElements > 3) {
        problems.push('Elementos DOM órfãos detectados');
      }
      
      // Verifica problemas específicos de certificações
      if (location.pathname.includes('/certificacoes')) {
        const certProblems = detectCertificationProblems();
        problems.push(...certProblems);
      }
      
      // Verifica erros de console
      const hasConsoleErrors = (console as any)._errorCount > 0;
      if (hasConsoleErrors) {
        problems.push('Erros de console detectados');
      }

      // Sempre mostra o botão em páginas administrativas, mas só expande menu se há problemas
      setShouldShow(true);
      
      // Se há problemas, mostra menu avançado e aviso
      if (problems.length > 0) {
        setShowAdvanced(true);
        toast({
          title: '⚠️ Problemas detectados',
          description: `${problems.length} problemas encontrados. Use as ferramentas de limpeza.`,
          variant: 'destructive'
        });
      }
    };

    // Executa detecção após carregamento
    const timer = setTimeout(detectProblems, 3000);
    return () => clearTimeout(timer);
  }, [location.pathname, toast]);

  const handleQuickCleanup = async () => {
    setIsClearing(true);
    try {
      performBrowserCleanup();
      toast({
        title: '✅ Cache limpo',
        description: 'Limpeza rápida concluída com sucesso',
        variant: 'default'
      });
      
      // Recarrega a página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: '❌ Erro na limpeza',
        description: 'Falha ao limpar cache. Tente recarregar a página.',
        variant: 'destructive'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCertificationsCleanup = async () => {
    setIsClearing(true);
    try {
      clearCertificationsCache();
      toast({
        title: '✅ Cache de certificações limpo',
        description: 'Problemas específicos de certificações resolvidos',
        variant: 'default'
      });
      
      setTimeout(() => {
        window.location.href = '/certificacoes';
      }, 1000);
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Falha ao limpar cache de certificações',
        variant: 'destructive'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleFullCleanup = async () => {
    setIsClearing(true);
    try {
      // Executa limpeza completa
      performBrowserCleanup();
      clearReactQueryCache();
      clearBrowserCache();
      clearCertificationsCache();
      
      toast({
        title: '🧹 Limpeza completa realizada',
        description: 'Todos os caches e dados temporários foram limpos',
        variant: 'default'
      });
      
      // Força reload completo
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 1500);
    } catch (error) {
      toast({
        title: '❌ Erro na limpeza completa',
        description: 'Tente fechar e abrir o navegador',
        variant: 'destructive'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDiagnostics = () => {
    const results = performFullSystemDiagnostic();
    setDiagnostics(results);
    
    toast({
      title: '📊 Diagnóstico concluído',
      description: 'Verifique o console para detalhes completos',
      variant: 'default'
    });
  };

  // Se não deve mostrar, não renderiza nada
  if (!shouldShow) {
    return null;
  }

  if (!showAdvanced) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleQuickCleanup}
          disabled={isClearing}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-300 hover:bg-gray-50"
        >
          {isClearing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="ml-2">Limpar Cache</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Botão principal */}
      <Button
        onClick={handleQuickCleanup}
        disabled={isClearing}
        variant="outline"
        size="sm"
        className="w-full bg-white/90 backdrop-blur-sm shadow-lg border-gray-300 hover:bg-gray-50"
      >
        {isClearing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        <span className="ml-2">Limpeza Rápida</span>
      </Button>

      {/* Menu avançado */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
        <div className="text-xs font-medium text-gray-600 mb-2 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
          Ferramentas Avançadas
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={handleCertificationsCleanup}
            disabled={isClearing}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-2 text-blue-500" />
            Cache Certificações
          </Button>
          
          <Button
            onClick={handleFullCleanup}
            disabled={isClearing}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <Zap className="h-3 w-3 mr-2 text-red-500" />
            Limpeza Completa
          </Button>
          
          <Button
            onClick={handleDiagnostics}
            disabled={isClearing}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <AlertTriangle className="h-3 w-3 mr-2 text-orange-500" />
            Diagnóstico
          </Button>
        </div>

        {diagnostics && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              LS: {Object.keys(diagnostics.localStorage).length} itens
              <br />
              DOM: {diagnostics.domElements.orphanedPortals + diagnostics.domElements.orphanedToasters} órfãos
              <br />
              Erros: {diagnostics.errors.length}
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-200">
          <Button
            onClick={() => setShowAdvanced(false)}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-500"
          >
            Ocultar menu
          </Button>
        </div>
      </div>
    </div>
  );
}