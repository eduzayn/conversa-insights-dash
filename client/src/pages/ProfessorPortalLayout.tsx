import { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
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
  const navigate = useNavigate();
  const [professorData, setProfessorData] = useState<ProfessorData | null>(null);

  useEffect(() => {
    // Verificar se há dados do professor no localStorage
    const token = localStorage.getItem('professor_token');
    const data = localStorage.getItem('professor_data');
    
    if (!token || !data) {
      navigate('/professor/login');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setProfessorData(parsedData);
    } catch (error) {
      console.error('Erro ao carregar dados do professor:', error);
      navigate('/professor/login');
    }
  }, [navigate]);

  if (!professorData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProfessorLayout professorData={professorData}>
      <Routes>
        <Route path="/dashboard" element={<ProfessorDashboard />} />
        <Route path="/disciplinas" element={<Disciplinas />} />
        <Route path="/conteudos" element={<Conteudos />} />
        <Route path="/avaliacoes" element={<Avaliacoes />} />
        <Route path="/submissoes" element={<Submissoes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/perfil" element={<PerfilProfessor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProfessorLayout>
  );
}