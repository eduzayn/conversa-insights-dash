
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RefreshCw, AlertCircle, Plus } from "lucide-react";

interface AtendimentosHeaderProps {
  isLoading: boolean;
  atendimentosCount: number;
  error: any;
  onRefetch: () => void;
  onExportCSV: () => void;
  onCreateAtendimento: () => void;
}

export const AtendimentosHeader = ({ 
  isLoading, 
  atendimentosCount, 
  error, 
  onRefetch, 
  onExportCSV,
  onCreateAtendimento
}: AtendimentosHeaderProps) => {
  
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diário de Atendimentos</h1>
          <p className="text-gray-600">
            Visualize todos os atendimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={onCreateAtendimento}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Atendimento
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
