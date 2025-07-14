
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MetasHeaderProps {
  onConfigureMetas: () => void;
}

export const MetasHeader = ({ onConfigureMetas }: MetasHeaderProps) => {

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Metas & Engajamento</h1>
        <p className="text-gray-600">Sistema de gamificação e acompanhamento de metas</p>
      </div>
      <div className="flex gap-2">
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
