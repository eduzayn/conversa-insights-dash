import { useState, useEffect } from "react";
import { useLocation, Router, Route } from "wouter";
import { ProfessorLayout } from "@/components/professor/ProfessorLayout";
import ProfessorDashboard from "./professor/ProfessorDashboard";
import Disciplinas from "./professor/Disciplinas";
import Conteudos from "./professor/Conteudos";
import Avaliacoes from "./professor/Avaliacoes";
import Submissoes from "./professor/Submissoes";
import Relatorios from "./professor/Relatorios";
import PerfilProfessor from "./professor/PerfilProfessor";
import NotFound from "./NotFound";

interface ProfessorData {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function ProfessorPortalLayout() {
  const [, setLocation] = useLocation();
  const [professorData, setProfessorData] = useState<ProfessorData | null>(null);

  useEffect(() => {
    // Verificar se há dados do professor no localStorage
    const token = localStorage.getItem('professor_token');
    const data = localStorage.getItem('professor_data');
    
    if (!token || !data) {
      setLocation('/professor/login');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setProfessorData(parsedData);
    } catch (error) {
      console.error('Erro ao carregar dados do professor:', error);
      setLocation('/professor/login');
    }
  }, [setLocation]);

  if (!professorData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProfessorLayout professorData={professorData}>
      <Router base="/professor">
        <Route path="/dashboard" component={ProfessorDashboard} />
        <Route path="/disciplinas" component={Disciplinas} />
        <Route path="/conteudos" component={Conteudos} />
        <Route path="/avaliacoes" component={Avaliacoes} />
        <Route path="/submissoes" component={Submissoes} />
        <Route path="/relatorios" component={Relatorios} />
        <Route path="/perfil" component={PerfilProfessor} />
        <Route component={NotFound} />
      </Router>
    </ProfessorLayout>
  );
}