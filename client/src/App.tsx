
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

// Lazy pages - Professor Portal
const ProfessorPortalLayout = lazy(() => import("./pages/professor/ProfessorPortalLayout"));
const ProfessorDashboard = lazy(() => import("./pages/professor/ProfessorDashboard"));
const DisciplinasFixed = lazy(() => import("./pages/professor/DisciplinasFixed"));
const ConteudosFixed = lazy(() => import("./pages/professor/ConteudosFixed"));
const AvaliacoesFixed = lazy(() => import("./pages/professor/AvaliacoesFixed"));
const Submissoes = lazy(() => import("./pages/professor/Submissoes"));
const Relatorios = lazy(() => import("./pages/professor/Relatorios"));
const PerfilProfessor = lazy(() => import("./pages/professor/PerfilProfessor"));

// Lazy pages - Student Portal  
const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));
const MeusCursos = lazy(() => import("./pages/portal/MeusCursos"));
const MinhasAvaliacoes = lazy(() => import("./pages/portal/MinhasAvaliacoes"));
const Pagamentos = lazy(() => import("./pages/portal/Pagamentos"));
const Documentos = lazy(() => import("./pages/portal/Documentos"));
const Certificados = lazy(() => import("./pages/portal/Certificados"));
const Carteirinha = lazy(() => import("./pages/portal/Carteirinha"));
const SuporteChat = lazy(() => import("./pages/portal/SuporteChat"));
const PerfilAluno = lazy(() => import("./pages/portal/PerfilAluno"));

// Lazy pages - 404
const NotFound = lazy(() => import("./pages/admin/core/NotFound"));

// Rotas consolidadas para evitar duplicação
const routeGroups = {
  certificacoes: ["/admin/certificacoes", "/admin/academic/certifications", "/certificacoes"],
  certificadosPos: ["/certificados-pos", "/certificados-academicos"],
  matrizesCurriculares: ["/matrizes-curriculares", "/gestao-cursos", "/gestao-academica"],
  charges: ["/charges", "/cobrancas"],
  certificacoesFadyc: ["/certificacoes-fadyc", "/admin/reports/certificacoes-fadyc"],
  professorLogin: ["/professor-login", "/professor/login"]
};

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
                  {/* Rotas únicas */}
                  <Route path="/" element={<LoginHub />} />
                  <Route path="/login" element={<LoginHub />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin" element={<Dashboard />} />
                  
                  {/* Operações */}
                  <Route path="/atendimentos" element={<Atendimentos />} />
                  <Route path="/atendimento-aluno" element={<AtendimentoAluno />} />
                  <Route path="/produtividade" element={<Produtividade />} />
                  <Route path="/presenca" element={<Presenca />} />
                  <Route path="/chat-interno" element={<ChatInterno />} />
                  <Route path="/metas" element={<Metas />} />
                  <Route path="/crm" element={<Crm />} />
                  
                  {/* Rotas consolidadas - Certificações */}
                  {routeGroups.certificacoes.map((path) => (
                    <Route key={path} path={path} element={<Certificacoes />} />
                  ))}
                  
                  {/* Rotas consolidadas - Certificados Pós */}
                  {routeGroups.certificadosPos.map((path) => (
                    <Route key={path} path={path} element={<CertificadosPos />} />
                  ))}
                  
                  {/* Rotas consolidadas - Matrizes Curriculares */}
                  {routeGroups.matrizesCurriculares.map((path) => (
                    <Route key={path} path={path} element={<MatrizesCurriculares />} />
                  ))}
                  
                  {/* Rotas consolidadas - Charges */}
                  {routeGroups.charges.map((path) => (
                    <Route key={path} path={path} element={<ChargesPage />} />
                  ))}
                  
                  {/* Rotas consolidadas - Certificações FADYC */}
                  {routeGroups.certificacoesFadyc.map((path) => (
                    <Route key={path} path={path} element={<CertificacoesFadyc />} />
                  ))}
                  
                  {/* Configurações e Integrações */}
                  <Route path="/gerenciamento-roteamento" element={<GerenciamentoRoteamento />} />
                  <Route path="/integracao-asaas" element={<IntegracaoAsaas />} />
                  <Route path="/gerenciar-tokens" element={<GerenciarTokens />} />
                  
                  {/* Relatórios */}
                  <Route path="/negociacoes" element={<Negociacoes />} />
                  <Route path="/envios-unicv" element={<EnviosUnicv />} />
                  <Route path="/envios-famar" element={<EnviosFamar />} />
                  
                  {/* Financeiro */}
                  <Route path="/matricula-simplificada" element={<MatriculaSimplificada />} />
                  
                  {/* Portal do Aluno */}
                  <Route path="/portal-aluno/login" element={<StudentLogin />} />
                  <Route path="/portal" element={<PortalLayout />} />
                  <Route path="/portal/cursos" element={<MeusCursos />} />
                  <Route path="/portal/avaliacoes" element={<MinhasAvaliacoes />} />
                  <Route path="/portal/pagamentos" element={<Pagamentos />} />
                  <Route path="/portal/documentos" element={<Documentos />} />
                  <Route path="/portal/certificados" element={<Certificados />} />
                  <Route path="/portal/carteirinha" element={<Carteirinha />} />
                  <Route path="/portal/suporte" element={<SuporteChat />} />
                  <Route path="/portal/perfil" element={<PerfilAluno />} />
                  <Route path="/portal/*" element={<PortalLayout />} />
                  
                  {/* Portal do Professor */}
                  {routeGroups.professorLogin.map((path) => (
                    <Route key={path} path={path} element={<ProfessorLogin />} />
                  ))}
                  <Route path="/professor" element={<ProfessorPortalLayout />} />
                  <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
                  <Route path="/professor/disciplinas" element={<DisciplinasFixed />} />
                  <Route path="/professor/conteudos" element={<ConteudosFixed />} />
                  <Route path="/professor/avaliacoes" element={<AvaliacoesFixed />} />
                  <Route path="/professor/submissoes" element={<Submissoes />} />
                  <Route path="/professor/relatorios" element={<Relatorios />} />
                  <Route path="/professor/perfil" element={<PerfilProfessor />} />
                  <Route path="/professor/*" element={<ProfessorPortalLayout />} />
                  
                  {/* 404 */}
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
