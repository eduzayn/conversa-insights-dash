
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { AtendimentosFilters as FiltersType } from "@/types/atendimento";

interface AtendimentosFiltersProps {
  filters: FiltersType;
  onUpdateFilters: (newFilters: Partial<FiltersType>) => void;
  onClearFilters: () => void;
}

export const AtendimentosFilters = ({ filters, onUpdateFilters, onClearFilters }: AtendimentosFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Filtros</CardTitle>
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Limpar Filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar por nome..." 
              className="pl-9"
              value={filters.search || ''}
              onChange={(e) => onUpdateFilters({ search: e.target.value })}
            />
          </div>
          <Select value={filters.periodo || ''} onValueChange={(value) => onUpdateFilters({ periodo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="ontem">Ontem</SelectItem>
              <SelectItem value="esta-semana">Esta Semana</SelectItem>
              <SelectItem value="semana-passada">Semana Passada</SelectItem>
              <SelectItem value="este-mes">Este Mês</SelectItem>
              <SelectItem value="mes-passado">Mês Passado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.atendente || ''} onValueChange={(value) => onUpdateFilters({ atendente: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Atendente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ana">Ana Santos</SelectItem>
              <SelectItem value="carlos">Carlos Lima</SelectItem>
              <SelectItem value="bruna">Bruna Reis</SelectItem>
              <SelectItem value="diego">Diego Alves</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.equipe || ''} onValueChange={(value) => onUpdateFilters({ equipe: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="suporte">Suporte</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status || ''} onValueChange={(value) => onUpdateFilters({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="andamento">Em andamento</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
