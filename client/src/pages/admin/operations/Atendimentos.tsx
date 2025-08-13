
import { useState } from "react";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AtendimentosHeader } from "@/components/atendimentos/AtendimentosHeader";
import { AtendimentosFilters } from "@/components/atendimentos/AtendimentosFilters";
import { AtendimentosTable } from "@/components/atendimentos/AtendimentosTable";
import { AtendimentoFormModal } from "@/components/atendimentos/AtendimentoFormModal";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

const Atendimentos = () => {
  const { user, loading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAtendimento, setEditingAtendimento] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  
  const {
    atendimentos,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    updateStatus,
    updateResultado,
    isUpdatingStatus,
    refetch,
    exportToCSV,
    createAtendimento,
    updateAtendimento,
    deleteAtendimento,
    // Scroll infinito
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useAtendimentos();



  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus(id, newStatus as any);
  };

  const handleResultadoChange = (id: string, newResultado: string) => {
    updateResultado(id, newResultado as any);
  };

  const handleCreateAtendimento = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditAtendimento = (atendimento: any) => {
    setEditingAtendimento(atendimento);
  };

  const handleDeleteAtendimento = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDuplicateAtendimento = (atendimento: any) => {
    // Preparar dados para duplicação com data/hora atual
    const currentDate = new Date();
    const currentDateString = currentDate.toLocaleDateString('pt-BR');
    const currentTimeString = currentDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const duplicatedAtendimento = {
      ...atendimento,
      id: undefined, // Remove o ID para criar um novo registro
      data: currentDateString,
      hora: currentTimeString,
      createdAt: undefined,
      updatedAt: undefined,
      status: 'Em andamento', // Novo atendimento sempre inicia em andamento
      resultado: null, // Limpa o resultado CRM para nova classificação
      observacoes: atendimento.observacoes ? 
        `[DUPLICADO] ${atendimento.observacoes}` : 
        `[DUPLICADO] Atendimento duplicado do registro original em ${atendimento.data || 'data não informada'}`
    };

    // Abrir modal de edição com dados pré-preenchidos
    setEditingAtendimento(duplicatedAtendimento);
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteAtendimento(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingAtendimento(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
            <AtendimentosHeader
              isLoading={isLoading}
              atendimentosCount={atendimentos.length}
              error={error}
              onExportCSV={exportToCSV}
              onCreateAtendimento={handleCreateAtendimento}
            />

            <AtendimentosFilters
              filters={filters}
              onUpdateFilters={updateFilters}
              onClearFilters={clearFilters}
            />

            <AtendimentosTable
              atendimentos={atendimentos}
              isLoading={isLoading}
              isUpdatingStatus={isUpdatingStatus}
              onStatusChange={handleStatusChange}
              onResultadoChange={handleResultadoChange}
              onEditAtendimento={handleEditAtendimento}
              onDeleteAtendimento={handleDeleteAtendimento}
              onDuplicateAtendimento={handleDuplicateAtendimento}
              filters={filters}
              // Scroll infinito
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        </main>
      </div>

      {/* Modal de Criar/Editar Atendimento */}
      <AtendimentoFormModal
        isOpen={isCreateModalOpen || !!editingAtendimento}
        onClose={handleCloseModal}
        atendimento={editingAtendimento}
        onSubmit={editingAtendimento && editingAtendimento.id ? updateAtendimento : createAtendimento}
        title={editingAtendimento && !editingAtendimento.id ? 'Duplicar Atendimento' : 
               editingAtendimento ? 'Editar Atendimento' : 'Novo Atendimento'}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Confirmar exclusão do atendimento"
        description="Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita."
      />
    </AdminLayout>
  );
};

export default Atendimentos;
