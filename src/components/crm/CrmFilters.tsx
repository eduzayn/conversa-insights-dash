
import { CrmFilters } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';

interface CrmFiltersProps {
  filters: CrmFilters;
  onFiltersChange: (filters: CrmFilters) => void;
  availableTeams: string[];
  availableAttendants: string[];
  availableCourses: string[];
}

export const CrmFilters = ({
  filters,
  onFiltersChange,
  availableTeams,
  availableAttendants,
  availableCourses
}: CrmFiltersProps) => {
  const handleFilterChange = (key: keyof CrmFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Equipe
            </label>
            <Select
              value={filters.team || ''}
              onValueChange={(value) => handleFilterChange('team', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todas as equipes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as equipes</SelectItem>
                {availableTeams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team.charAt(0).toUpperCase() + team.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Responsável
            </label>
            <Select
              value={filters.assignedTo || ''}
              onValueChange={(value) => handleFilterChange('assignedTo', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os responsáveis</SelectItem>
                {availableAttendants.map(attendant => (
                  <SelectItem key={attendant} value={attendant}>
                    {attendant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Curso
            </label>
            <Select
              value={filters.course || ''}
              onValueChange={(value) => handleFilterChange('course', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Todos os cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os cursos</SelectItem>
                {availableCourses.map(course => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Data (a partir de)
            </label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
