
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupportChatButton } from "@/components/chat/SupportChatButton";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/admin/Index";
import Login from "./pages/admin/Login";
import Atendimentos from "./pages/admin/Atendimentos";
import AtendimentoAluno from "./pages/admin/AtendimentoAluno";
import Produtividade from "./pages/admin/Produtividade";
import Presenca from "./pages/admin/Presenca";
import ChatInterno from "./pages/admin/ChatInterno";
import Metas from "./pages/admin/Metas";
import Crm from "./pages/admin/Crm";
import Certificacoes from "./pages/admin/Certificacoes";
import IntegracaoBotConversa from "./pages/admin/IntegracaoBotConversa";
import GerenciamentoRoteamento from "./pages/admin/GerenciamentoRoteamento";
import IntegracaoAsaas from "./pages/admin/IntegracaoAsaas";
import MatriculaSimplificada from "./pages/admin/MatriculaSimplificada";
import StudentLogin from "./pages/portal/StudentLogin";
import LoginRouter from "./components/LoginRouter";

import PortalLayout from "./pages/portal/PortalLayout";
import ProfessorLogin from "./pages/professor/ProfessorLogin";
import ProfessorPortalLayout from "./pages/professor/ProfessorPortalLayout";
import NotFound from "./pages/admin/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRouter />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Index />} />
            <Route path="/atendimentos" element={<Atendimentos />} />
            <Route path="/atendimento-aluno" element={<AtendimentoAluno />} />
            <Route path="/produtividade" element={<Produtividade />} />
            <Route path="/presenca" element={<Presenca />} />
            <Route path="/chat-interno" element={<ChatInterno />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/crm" element={<Crm />} />
            <Route path="/certificacoes" element={<Certificacoes />} />
            <Route path="/integracao-botconversa" element={<IntegracaoBotConversa />} />
            <Route path="/gerenciamento-roteamento" element={<GerenciamentoRoteamento />} />
            <Route path="/integracao-asaas" element={<IntegracaoAsaas />} />
            <Route path="/matricula-simplificada" element={<MatriculaSimplificada />} />
            {/* Portal do Aluno */}
            <Route path="/portal-aluno/login" element={<StudentLogin />} />
            <Route path="/portal/*" element={<PortalLayout />} />
            {/* Portal do Professor */}
            <Route path="/professor-login" element={<ProfessorLogin />} />
            <Route path="/professor/login" element={<ProfessorLogin />} />
            <Route path="/professor/*" element={<ProfessorPortalLayout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportChatButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
