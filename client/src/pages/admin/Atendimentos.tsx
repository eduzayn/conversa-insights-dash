
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AtendimentosHeader } from "@/components/atendimentos/AtendimentosHeader";
import { AtendimentosFilters } from "@/components/atendimentos/AtendimentosFilters";
import { AtendimentosTable } from "@/components/atendimentos/AtendimentosTable";

const Atendimentos = () => {
  const { user, loading } = useAuth();
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
              onRefetch={refetch}
              onExportCSV={exportToCSV}
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
              filters={filters}
              // Scroll infinito
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Atendimentos;
