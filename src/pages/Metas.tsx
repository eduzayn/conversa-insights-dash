
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ConfigurarMetasModal } from "@/components/ConfigurarMetasModal";
import { RecompensasModal } from "@/components/RecompensasModal";
import { MetaConquistada } from "@/components/MetaConquistada";
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
    fecharNotificacao, 
    simularConquista 
  } = useMetaNotificacoes();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <MetasHeader 
              onConfigureMetas={() => setIsMetasModalOpen(true)}
              onSimularConquista={simularConquista}
            />

            <MetasSummaryCards />

            <EquipesSummaryTable />

            <RankingTable 
              onVerRecompensas={() => setIsRecompensasModalOpen(true)}
            />
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
