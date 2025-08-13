
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupportChatButton } from "@/components/chat/SupportChatButton";
import { queryClient } from "@/lib/queryClient";
import AppErrorBoundary from "@/components/utils/AppErrorBoundary";
import ScrollToTop from "@/components/utils/ScrollToTop";

// Lazy pages - Auth
const LoginHub = lazy(() => import("./pages/auth/LoginHub"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const Register = lazy(() => import("./pages/auth/Register"));
const StudentLogin = lazy(() => import("./pages/auth/StudentLogin"));
const ProfessorLogin = lazy(() => import("./pages/auth/ProfessorLogin"));

// Lazy pages - Admin Core
const Dashboard = lazy(() => import("./pages/admin/core/Dashboard"));

// Lazy pages - Admin Academic
const Certificacoes = lazy(() => import("./pages/admin/academic/Certificacoes"));
const CertificadosPos = lazy(() => import("./pages/admin/academic/CertificadosPos"));
const MatriculaSimplificada = lazy(() => import("./pages/admin/academic/MatriculaSimplificada"));
const MatrizesCurriculares = lazy(() => import("./pages/admin/academic/MatrizesCurriculares"));

// Lazy pages - Admin Operations
const Atendimentos = lazy(() => import("./pages/admin/operations/Atendimentos"));
const AtendimentoAluno = lazy(() => import("./pages/admin/operations/AtendimentoAluno"));
const ChatInterno = lazy(() => import("./pages/admin/operations/ChatInterno"));
const Crm = lazy(() => import("./pages/admin/operations/Crm"));
const Presenca = lazy(() => import("./pages/admin/operations/Presenca"));
const Produtividade = lazy(() => import("./pages/admin/operations/Produtividade"));

// Lazy pages - Admin Reports
const EnviosFamar = lazy(() => import("./pages/admin/reports/EnviosFamar"));
const EnviosUnicv = lazy(() => import("./pages/admin/reports/EnviosUnicv"));
const Negociacoes = lazy(() => import("./pages/admin/reports/Negociacoes"));
const CertificacoesFadyc = lazy(() => import("./pages/admin/reports/CertificacoesFadyc"));

// Lazy pages - Admin Settings
const GerenciamentoRoteamento = lazy(() => import("./pages/admin/settings/GerenciamentoRoteamento"));
const GerenciarTokens = lazy(() => import("./pages/admin/settings/GerenciarTokens"));
const Metas = lazy(() => import("./pages/admin/settings/Metas"));

// Lazy pages - Admin Integrations
const IntegracaoAsaas = lazy(() => import("./pages/admin/integrations/IntegracaoAsaas"));

// Lazy pages - Admin Financial
const ChargesPage = lazy(() => import("./pages/admin/financial/charges-page"));

// Lazy pages - Portal Components
const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));
const ProfessorPortalLayout = lazy(() => import("./pages/professor/ProfessorPortalLayout"));
const NotFound = lazy(() => import("./pages/admin/core/NotFound"));

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
          <Sonner 
            position="top-right" 
            richColors 
            className="toaster-sonner"
            toastOptions={{
              duration: 4000,
              className: 'toaster-sonner'
            }}
          />
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
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
              </Suspense>
              <SupportChatButton />
            </AuthProvider>
          </BrowserRouter>
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AppErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
