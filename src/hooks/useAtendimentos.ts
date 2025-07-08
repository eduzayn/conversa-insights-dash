
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { atendimentosService } from '@/services/atendimentosService';
import { AtendimentoData, AtendimentosFilters } from '@/types/atendimento';
import { toast } from 'sonner';

export const useAtendimentos = (initialFilters: AtendimentosFilters = {}) => {
  const [filters, setFilters] = useState<AtendimentosFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Query para buscar atendimentos
  const {
    data: atendimentos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['atendimentos', filters],
    queryFn: () => atendimentosService.getAtendimentos(filters),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 10000, // Considera dados frescos por 10 segundos
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AtendimentoData['status'] }) =>
      atendimentosService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status. Tente novamente.');
    },
  });

  // Funções de controle
  const updateFilters = useCallback((newFilters: Partial<AtendimentosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const updateStatus = useCallback((id: string, status: AtendimentoData['status']) => {
    updateStatusMutation.mutate({ id, status });
  }, [updateStatusMutation]);

  const exportToCSV = useCallback(() => {
    const headers = ['Nome do Lead', 'Hora', 'Atendente', 'Equipe', 'Duração', 'Status'];
    const csvContent = [
      headers.join(','),
      ...atendimentos.map(item => 
        [item.lead, item.hora, item.atendente, item.equipe, item.duracao, item.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atendimentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  }, [atendimentos]);

  // Auto-refresh quando a aba fica visível novamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  return {
    atendimentos,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    updateStatus,
    isUpdatingStatus: updateStatusMutation.isPending,
    refetch,
    exportToCSV
  };
};
