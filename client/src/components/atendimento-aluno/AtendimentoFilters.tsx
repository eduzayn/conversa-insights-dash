
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface AtendimentoFiltersProps {
  filters: {
    curso: string;
    status: string;
    atendente: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const AtendimentoFilters = ({ filters, onFiltersChange }: AtendimentoFiltersProps) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? '' : value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      curso: '',
      status: '',
      atendente: ''
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
      </div>
      
      <Select value={filters.curso || 'all'} onValueChange={(value) => handleFilterChange('curso', value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Curso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Cursos</SelectItem>
          <SelectItem value="Matemática">Matemática</SelectItem>
          <SelectItem value="Biologia">Biologia</SelectItem>
          <SelectItem value="História">História</SelectItem>
          <SelectItem value="Português">Português</SelectItem>
          <SelectItem value="Química">Química</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="novo">Novo</SelectItem>
          <SelectItem value="em_andamento">Em Andamento</SelectItem>
          <SelectItem value="finalizado">Finalizado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.atendente || 'all'} onValueChange={(value) => handleFilterChange('atendente', value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Atendente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Atendentes</SelectItem>
          <SelectItem value="Ana Santos">Ana Santos</SelectItem>
          <SelectItem value="Carlos Lima">Carlos Lima</SelectItem>
          <SelectItem value="Bruna Reis">Bruna Reis</SelectItem>
        </SelectContent>
      </Select>

      <Button 
        variant="outline" 
        size="sm"
        onClick={clearFilters}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar
      </Button>
    </div>
  );
};
