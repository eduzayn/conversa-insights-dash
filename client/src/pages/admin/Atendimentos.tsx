
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AtendimentosHeader } from "@/components/atendimentos/AtendimentosHeader";
import { AtendimentosFilters } from "@/components/atendimentos/AtendimentosFilters";
import { AtendimentosTable } from "@/components/atendimentos/AtendimentosTable";
import { AtendimentoFormModal } from "@/components/atendimentos/AtendimentoFormModal";

const Atendimentos = () => {
  const { user, loading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAtendimento, setEditingAtendimento] = useState(null);
  
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
    if (window.confirm('Tem certeza que deseja excluir este atendimento?')) {
      deleteAtendimento(id);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingAtendimento(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
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
        onSubmit={editingAtendimento ? updateAtendimento : createAtendimento}
        title={editingAtendimento ? 'Editar Atendimento' : 'Novo Atendimento'}
      />
    </div>
  );
};

export default Atendimentos;
