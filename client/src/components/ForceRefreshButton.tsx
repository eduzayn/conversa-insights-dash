// Botão de limpeza manual de cache - Correção específica para problema do Erick
// Baseado na solução documentada em replit.md linha 798-814

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cleanupBrowserState } from '@/utils/cacheCleanup';

export const ForceRefreshButton: React.FC = () => {
  const handleForceRefresh = () => {
    console.log('[FORCE-REFRESH] Limpeza manual iniciada - Problema específico do usuário Erick Moreira');
    cleanupBrowserState();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleForceRefresh}
        variant="outline"
        size="sm"
        className="bg-white border-red-300 text-red-600 hover:bg-red-50 shadow-lg"
        title="Limpar cache e recarregar (específico para problemas de visualização)"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Limpar Cache
      </Button>
    </div>
  );
};