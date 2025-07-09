
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RefreshCw, AlertCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { atendimentosService } from "@/services/atendimentosService";

interface AtendimentosHeaderProps {
  isLoading: boolean;
  atendimentosCount: number;
  error: any;
  onRefetch: () => void;
  onExportCSV: () => void;
}

export const AtendimentosHeader = ({ 
  isLoading, 
  atendimentosCount, 
  error, 
  onRefetch, 
  onExportCSV 
}: AtendimentosHeaderProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSyncConversations = async () => {
    setIsSyncing(true);
    try {
      await atendimentosService.syncConversations();
      // Atualizar dados após sincronização
      onRefetch();
    } catch (error) {
      console.error('Erro ao sincronizar conversas:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatório de Atendimentos</h1>
          <p className="text-gray-600">
            Visualize todos os atendimentos {isLoading ? '(Carregando...)' : `(${atendimentosCount} atendimentos)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncConversations}
            disabled={isSyncing || isLoading}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar BotConversa
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={onExportCSV}
            disabled={atendimentosCount === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>Erro ao carregar dados. Usando dados locais temporariamente.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
