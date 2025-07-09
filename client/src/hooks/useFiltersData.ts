import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface FiltersData {
  atendentes: string[];
  equipes: string[];
  status: string[];
  managersData: {
    id: number;
    name: string;
    email: string;
    equipe: string;
    assign_chat: number;
  }[];
}

export const useFiltersData = () => {
  return useQuery<FiltersData>({
    queryKey: ['filters-data'],
    queryFn: () => apiRequest('/api/atendimentos/filters-data'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });
};