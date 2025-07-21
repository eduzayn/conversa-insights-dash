import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { performBrowserCleanup } from "@/utils/cacheCleanup";

export const ForceRefreshButton = () => {
  const handleForceRefresh = () => {
    // Executa limpeza completa
    performBrowserCleanup();
    
    // Aguarda um pouco para a limpeza completar, então recarrega
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Button
      onClick={handleForceRefresh}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-white shadow-lg hover:bg-gray-50"
      title="Limpar cache e recarregar - Use se encontrar erros na interface"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Limpar Cache
    </Button>
  );
};