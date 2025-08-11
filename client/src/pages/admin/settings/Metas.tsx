
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ConfigurarMetasModal } from "@/components/modals/ConfigurarMetasModal";
import { RecompensasModal } from "@/components/modals/RecompensasModal";
import { MetaConquistada } from "@/components/modals/MetaConquistada";
import { useMetaNotificacoes } from "@/hooks/useMetaNotificacoes";
import { MetasHeader } from "@/components/metas/MetasHeader";
import { MetasSummaryCards } from "@/components/metas/MetasSummaryCards";
import { EquipesSummaryTable } from "@/components/metas/EquipesSummaryTable";
import { RankingTable } from "@/components/metas/RankingTable";

const Metas = () => {
  const [isMetasModalOpen, setIsMetasModalOpen] = useState(false);
  const [isRecompensasModalOpen, setIsRecompensasModalOpen] = useState(false);
  
  const { 
    conquistaAtual, 
    isVisible, 
    fecharNotificacao
  } = useMetaNotificacoes();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <MetasHeader 
              onConfigureMetas={() => setIsMetasModalOpen(true)}
            />

            <MetasSummaryCards />

            <div className="space-y-4 md:space-y-6">
              <EquipesSummaryTable />
              <RankingTable 
                onVerRecompensas={() => setIsRecompensasModalOpen(true)}
              />
            </div>
          </div>
        </main>
      </div>

      <ConfigurarMetasModal 
        open={isMetasModalOpen} 
        onOpenChange={setIsMetasModalOpen} 
      />
      <RecompensasModal 
        open={isRecompensasModalOpen} 
        onOpenChange={setIsRecompensasModalOpen} 
      />
      
      {conquistaAtual && (
        <MetaConquistada
          isVisible={isVisible}
          onClose={fecharNotificacao}
          conquista={conquistaAtual}
        />
      )}
    </div>
  );
};

export default Metas;
