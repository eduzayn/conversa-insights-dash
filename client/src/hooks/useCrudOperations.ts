import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CrudConfig {
  entityName: string;
  endpoint: string;
  queryKeys: string[];
}

interface CrudOperations<T> {
  create: ReturnType<typeof useMutation>;
  update: ReturnType<typeof useMutation>;
  delete: ReturnType<typeof useMutation>;
  isLoading: boolean;
}

/**
 * Hook consolidado para operações CRUD que elimina duplicação
 * entre todas as páginas administrativas
 */
export function useCrudOperations<T = any>(config: CrudConfig): CrudOperations<T> {
  const queryClient = useQueryClient();
  const { entityName, endpoint, queryKeys } = config;

  const invalidateQueries = () => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: T) => {
      return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: "Sucesso",
        description: `${entityName} criado(a) com sucesso!`
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || `Erro ao criar ${entityName.toLowerCase()}`;
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: T }) => {
      return apiRequest(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: "Sucesso",
        description: `${entityName} atualizado(a) com sucesso!`
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || `Erro ao atualizar ${entityName.toLowerCase()}`;
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return apiRequest(`${endpoint}/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: "Sucesso",
        description: `${entityName} excluído(a) com sucesso!`
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || `Erro ao excluir ${entityName.toLowerCase()}`;
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    isLoading
  };
}