/**
 * Controle de paginação para certificações
 * 
 * Inclui navegação entre páginas, seleção de tamanho de página
 * e informações sobre os resultados exibidos
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CertificationPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCertifications: number;
  pageSize: number;
  searchTerm: string;
  filterStatus: string;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
}

export const CertificationPagination = ({
  currentPage,
  totalPages,
  totalCertifications,
  pageSize,
  searchTerm,
  filterStatus,
  isLoading,
  onPageChange,
  onPageSizeChange
}: CertificationPaginationProps) => {
  // Labels para os status
  const STATUS_LABELS = {
    'pendente': 'Pendente',
    'em_andamento': 'Em Andamento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
    'em_atraso': 'Em Atraso'
  };

  // Função para gerar números de página
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      const end = Math.min(totalPages, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (start > 1) {
        pages.unshift('...');
        pages.unshift(1);
      }
      
      if (end < totalPages) {
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <>
      {/* Contador de Resultados e Controles de Paginação */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            "Carregando..."
          ) : (
            <>
              {(() => {
                // Contador robusto que evita "Exibindo 1 a 0 de 0" quando não há dados
                const start = totalCertifications ? (currentPage - 1) * pageSize + 1 : 0;
                const end = totalCertifications ? Math.min(currentPage * pageSize, totalCertifications) : 0;
                
                if (totalCertifications === 0) {
                  return (
                    <>
                      Nenhuma certificação encontrada
                      {searchTerm && ` para "${searchTerm}"`}
                      {filterStatus && filterStatus !== 'todos' && ` com status "${STATUS_LABELS[filterStatus as keyof typeof STATUS_LABELS]}"`}
                    </>
                  );
                }
                
                return (
                  <>
                    Exibindo <strong>{start}</strong> a <strong>{end}</strong> de <strong>{totalCertifications}</strong> certificação{totalCertifications !== 1 ? 'ões' : ''} 
                    {searchTerm && ` para "${searchTerm}"`}
                    {filterStatus && filterStatus !== 'todos' && ` com status "${STATUS_LABELS[filterStatus as keyof typeof STATUS_LABELS]}"`}
                  </>
                );
              })()}
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-sm">Mostrar:</Label>
          <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Componente de Paginação */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, index) => (
                <div key={index}>
                  {pageNum === '...' ? (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="min-w-[40px]"
                      onClick={() => onPageChange(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </>
  );
};