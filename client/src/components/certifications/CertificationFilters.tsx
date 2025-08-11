/**
 * Componente de filtros para certificações
 * 
 * Contém todos os campos de filtro (busca, status, tipo de data, período e datas personalizadas)
 * Recebe e dispara alterações para o estado no componente pai
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface CertificationFiltersProps {
  searchTerm: string;
  filterStatus: string;
  filterTipoData: string;
  filterPeriodo: string;
  dataInicio: string;
  dataFim: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTipoDataChange: (value: string) => void;
  onPeriodoChange: (value: string) => void;
  onDataInicioChange: (value: string) => void;
  onDataFimChange: (value: string) => void;
}

export const CertificationFilters = ({
  searchTerm,
  filterStatus,
  filterTipoData,
  filterPeriodo,
  dataInicio,
  dataFim,
  onSearchChange,
  onStatusChange,
  onTipoDataChange,
  onPeriodoChange,
  onDataInicioChange,
  onDataFimChange
}: CertificationFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Primeira linha com 4 filtros principais */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Nome, CPF ou curso..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="filter-status">Status</Label>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="em_atraso">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-tipo-data">Filtrar por Data</Label>
            <Select value={filterTipoData} onValueChange={onTipoDataChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_prevista">Data Prevista de Entrega</SelectItem>
                <SelectItem value="inicio_certificacao">Data Início Certificação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-periodo">Período</Label>
            <Select value={filterPeriodo} onValueChange={onPeriodoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os períodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="mes_passado">Mês Passado</SelectItem>
                <SelectItem value="personalizado">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Campos de data personalizada (aparecem quando "personalizado" é selecionado) */}
        {filterPeriodo === 'personalizado' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => onDataInicioChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => onDataFimChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};