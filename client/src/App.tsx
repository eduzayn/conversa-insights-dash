
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupportChatButton } from "@/components/chat/SupportChatButton";
import { queryClient } from "@/lib/queryClient";
import ErrorBoundary from "@/components/utils/ErrorBoundary";

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
import CertificadosPos from "./pages/admin/CertificadosPos";

import GerenciamentoRoteamento from "./pages/admin/GerenciamentoRoteamento";
import ChargesPage from "./pages/admin/financial/charges-page";
import IntegracaoAsaas from "./pages/admin/IntegracaoAsaas";
import GerenciarTokens from "./pages/admin/GerenciarTokens";
import Negociacoes from "./pages/admin/Negociacoes";
import EnviosUnicv from "./pages/admin/EnviosUnicv";
import EnviosFamar from "./pages/admin/EnviosFamar";
import Register from "./pages/admin/Register";

import MatriculaSimplificada from "./pages/admin/MatriculaSimplificada";
import MatrizesCurriculares from "./pages/admin/MatrizesCurriculares";
import StudentLogin from "./pages/portal/StudentLogin";
import LoginRouter from "./components/auth/LoginRouter";
import LoginHub from "./pages/LoginHub";

import PortalLayout from "./pages/portal/PortalLayout";
import ProfessorLogin from "./pages/professor/ProfessorLogin";
import ProfessorPortalLayout from "./pages/professor/ProfessorPortalLayout";
import NotFound from "./pages/admin/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginHub />} />
            <Route path="/login" element={<LoginHub />} />
            <Route path="/login-antigo" element={<LoginRouter />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<Index />} />
            <Route path="/atendimentos" element={<Atendimentos />} />
            <Route path="/atendimento-aluno" element={<AtendimentoAluno />} />
            <Route path="/produtividade" element={<Produtividade />} />
            <Route path="/presenca" element={<Presenca />} />
            <Route path="/chat-interno" element={<ChatInterno />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/crm" element={<Crm />} />
            <Route path="/admin/certificacoes" element={<Certificacoes />} />
            <Route path="/certificacoes" element={<Certificacoes />} />
            <Route path="/certificados-pos" element={<CertificadosPos />} />

            <Route path="/gerenciamento-roteamento" element={<GerenciamentoRoteamento />} />
            <Route path="/charges" element={<ChargesPage />} />
            <Route path="/cobrancas" element={<ChargesPage />} />
            <Route path="/integracao-asaas" element={<IntegracaoAsaas />} />
            <Route path="/gerenciar-tokens" element={<GerenciarTokens />} />
            <Route path="/negociacoes" element={<Negociacoes />} />
            <Route path="/envios-unicv" element={<EnviosUnicv />} />
            <Route path="/envios-famar" element={<EnviosFamar />} />

            <Route path="/matricula-simplificada" element={<MatriculaSimplificada />} />
            <Route path="/matrizes-curriculares" element={<MatrizesCurriculares />} />
            <Route path="/gestao-academica" element={<MatrizesCurriculares />} />
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
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
