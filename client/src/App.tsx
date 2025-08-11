
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupportChatButton } from "@/components/chat/SupportChatButton";
import { queryClient } from "@/lib/queryClient";
import ErrorBoundary from "@/components/utils/ErrorBoundary";

// Auth Pages
import LoginHub from "./pages/auth/LoginHub";
import AdminLogin from "./pages/auth/AdminLogin";
import Register from "./pages/auth/Register";
import LoginRouter from "./components/auth/LoginRouter";

// Admin Dashboard
import Dashboard from "./pages/admin/Dashboard";

// Admin Academic
import Certificacoes from "./pages/admin/academic/Certificacoes";
import CertificadosPos from "./pages/admin/academic/CertificadosPos";
import MatriculaSimplificada from "./pages/admin/academic/MatriculaSimplificada";
import MatrizesCurriculares from "./pages/admin/academic/MatrizesCurriculares";

// Admin Operations
import Atendimentos from "./pages/admin/operations/Atendimentos";
import AtendimentoAluno from "./pages/admin/operations/AtendimentoAluno";
import ChatInterno from "./pages/admin/operations/ChatInterno";
import Crm from "./pages/admin/operations/Crm";
import Presenca from "./pages/admin/operations/Presenca";
import Produtividade from "./pages/admin/operations/Produtividade";

// Admin Reports
import EnviosFamar from "./pages/admin/reports/EnviosFamar";
import EnviosUnicv from "./pages/admin/reports/EnviosUnicv";
import Negociacoes from "./pages/admin/reports/Negociacoes";

// Admin Settings
import GerenciamentoRoteamento from "./pages/admin/settings/GerenciamentoRoteamento";
import GerenciarTokens from "./pages/admin/settings/GerenciarTokens";
import Metas from "./pages/admin/settings/Metas";

// Admin Integrations
import IntegracaoAsaas from "./pages/admin/integrations/IntegracaoAsaas";

// Admin Financial
import ChargesPage from "./pages/admin/financial/charges-page";

// Portal Student
import StudentLogin from "./pages/portal/StudentLogin";

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
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<Dashboard />} />
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
