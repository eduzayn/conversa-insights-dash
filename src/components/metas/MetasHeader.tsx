
import { Button } from "@/components/ui/button";
import { Plus, Bell } from "lucide-react";
import { toast } from "sonner";

interface MetasHeaderProps {
  onConfigureMetas: () => void;
  onSimularConquista: (tipo: 'individual' | 'equipe') => void;
}

export const MetasHeader = ({ onConfigureMetas, onSimularConquista }: MetasHeaderProps) => {
  const handleSimularConquista = (tipo: 'individual' | 'equipe') => {
    onSimularConquista(tipo);
    toast.success(`Simulando conquista ${tipo}!`, {
      description: "Aguarde a notificação aparecer..."
    });
  };

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Metas & Engajamento</h1>
        <p className="text-gray-600">Sistema de gamificação e acompanhamento de metas</p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={() => handleSimularConquista('individual')}
          variant="outline"
          className="bg-blue-50 hover:bg-blue-100"
        >
          <Bell className="h-4 w-4 mr-2" />
          Simular Individual
        </Button>
        <Button 
          onClick={() => handleSimularConquista('equipe')}
          variant="outline"
          className="bg-purple-50 hover:bg-purple-100"
        >
          <Bell className="h-4 w-4 mr-2" />
          Simular Equipe
        </Button>
        <Button 
          onClick={onConfigureMetas}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Configurar Metas
        </Button>
      </div>
    </div>
  );
};
