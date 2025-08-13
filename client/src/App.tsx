
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupportChatButton } from "@/components/chat/SupportChatButton";
import { queryClient } from "@/lib/queryClient";
import AppErrorBoundary from "@/components/utils/AppErrorBoundary";

// Auth Pages
import LoginHub from "./pages/auth/LoginHub";
import AdminLogin from "./pages/auth/AdminLogin";
import Register from "./pages/auth/Register";
import StudentLogin from "./pages/auth/StudentLogin";
import ProfessorLogin from "./pages/auth/ProfessorLogin";
// import LoginRouter from "./components/auth/LoginRouter";

// Admin Core
import Dashboard from "./pages/admin/core/Dashboard";

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
import CertificacoesFadyc from "./pages/admin/reports/CertificacoesFadyc";

// Admin Settings
import GerenciamentoRoteamento from "./pages/admin/settings/GerenciamentoRoteamento";
import GerenciarTokens from "./pages/admin/settings/GerenciarTokens";
import Metas from "./pages/admin/settings/Metas";

// Admin Integrations
import IntegracaoAsaas from "./pages/admin/integrations/IntegracaoAsaas";

// Admin Financial
import ChargesPage from "./pages/admin/financial/charges-page";

// Portal Components
import PortalLayout from "./pages/portal/PortalLayout";
import ProfessorPortalLayout from "./pages/professor/ProfessorPortalLayout";
import NotFound from "./pages/admin/core/NotFound";

const App = () => {
  // Proteção adicional contra erros de renderização - só em ambientes Replit
  React.useEffect(() => {
    const isReplitPreview =
      typeof window !== 'undefined' &&
      (location.hostname.includes('replit.dev') || location.hostname.includes('replit.app'));

    if (!isReplitPreview) return;

    const removeGarbage = () => {
      try {
        document
          .querySelectorAll('iframe[src*="workspace_iframe"], [data-testid*="workspace"]')
          .forEach((el) => el.remove());
      } catch {}
    };

    // roda uma vez
    removeGarbage();

    // observa mudanças e remove assim que aparecer
    const observer = new MutationObserver(() => removeGarbage());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppErrorBoundary>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginHub />} />
            <Route path="/login" element={<LoginHub />} />
            {/* <Route path="/login-router" element={<LoginRouter />} /> */}
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
            <Route path="/admin/academic/certifications" element={<Certificacoes />} />
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
            <Route path="/certificacoes-fadyc" element={<CertificacoesFadyc />} />
            <Route path="/admin/reports/certificacoes-fadyc" element={<CertificacoesFadyc />} />

            <Route path="/matricula-simplificada" element={<MatriculaSimplificada />} />
            <Route path="/matrizes-curriculares" element={<MatrizesCurriculares />} />
            <Route path="/certificados-academicos" element={<CertificadosPos />} />
            <Route path="/gestao-cursos" element={<MatrizesCurriculares />} />
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
        </AppErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
