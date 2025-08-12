/**
 * Hook customizado para gerenciar cursos FADYC
 * 
 * Fornece funcionalidades para buscar e criar cursos FADYC por categoria
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';
import type { CursoFadyc, InsertCursoFadyc } from '@shared/schema';

export const useCursosFadyc = (categoria?: string) => {
  const queryClient = useQueryClient();

  // Query para buscar cursos por categoria usando os cursos já cadastrados
  const { data: cursos = [], isLoading, error } = useQuery({
    queryKey: ['pre-registered-courses', categoria],
    queryFn: async (): Promise<any[]> => {
      try {
        const params = categoria ? `?categoria=${categoria}` : '';
        const response = await apiRequest(`/api/pre-registered-courses${params}`);
        if (Array.isArray(response)) {
          return response;
        }
        console.warn('Resposta da API de cursos não é um array:', response);
        return [];
      } catch (error) {
        console.error('Erro ao buscar cursos pré-cadastrados:', error);
        return [];
      }
    },
    enabled: !!categoria,
  });

  // Mutation para criar novo curso usando a tabela pre_registered_courses
  const createMutation = useMutation({
    mutationFn: async (curso: any) => {
      return apiRequest('/api/pre-registered-courses', {
        method: 'POST',
        body: JSON.stringify(curso),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast.success('Curso criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pre-registered-courses'] });
    },
    onError: () => {
      toast.error('Erro ao criar curso');
    },
  });

  return {
    cursos,
    isLoading,
    error,
    createCurso: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};