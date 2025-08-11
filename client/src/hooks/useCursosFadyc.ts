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

  // Query para buscar cursos por categoria
  const { data: cursos = [], isLoading, error } = useQuery({
    queryKey: ['cursos-fadyc', categoria],
    queryFn: async (): Promise<CursoFadyc[]> => {
      const params = categoria ? `?categoria=${categoria}` : '';
      const response = await fetch(`/api/cursos-fadyc${params}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar cursos FADYC');
      }
      return response.json();
    },
    enabled: !!categoria,
  });

  // Mutation para criar novo curso
  const createMutation = useMutation({
    mutationFn: async (curso: InsertCursoFadyc) => {
      const response = await fetch('/api/cursos-fadyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curso),
      });
      if (!response.ok) throw new Error('Erro ao criar curso');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Curso criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['cursos-fadyc'] });
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