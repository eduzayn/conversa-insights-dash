
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupportChatButton } from "@/components/chat/SupportChatButton";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Atendimentos from "./pages/Atendimentos";
import AtendimentoAluno from "./pages/AtendimentoAluno";
import Produtividade from "./pages/Produtividade";
import Presenca from "./pages/Presenca";
import ChatInterno from "./pages/ChatInterno";
import Metas from "./pages/Metas";
// TEMPORARIAMENTE DESABILITADO: Import do CRM será reativado em breve
// import Crm from "./pages/Crm";
import Certificacoes from "./pages/Certificacoes";
import IntegracaoBotConversa from "./pages/IntegracaoBotConversa";
import GerenciamentoRoteamento from "./pages/GerenciamentoRoteamento";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            <Route path="/atendimentos" element={<Atendimentos />} />
            <Route path="/atendimento-aluno" element={<AtendimentoAluno />} />
            <Route path="/produtividade" element={<Produtividade />} />
            <Route path="/presenca" element={<Presenca />} />
            <Route path="/chat-interno" element={<ChatInterno />} />
            <Route path="/metas" element={<Metas />} />
            {/* TEMPORARIAMENTE DESABILITADO: Rota do CRM será reativada em breve */}
            {/* <Route path="/crm" element={<Crm />} /> */}
            <Route path="/certificacoes" element={<Certificacoes />} />
            <Route path="/integracao-botconversa" element={<IntegracaoBotConversa />} />
            <Route path="/gerenciamento-roteamento" element={<GerenciamentoRoteamento />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportChatButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
