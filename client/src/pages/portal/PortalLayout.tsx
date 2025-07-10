import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ModernStudentLayout } from "@/components/portal/ModernStudentLayout";
import { StudentDashboard } from "@/components/portal/StudentDashboard";
import MeusCursos from "./MeusCursos";
import MinhasDisciplinas from "./MinhasDisciplinas";
import MinhasAvaliacoes from "./MinhasAvaliacoes";
import Certificados from "./Certificados";
import SuporteChat from "./SuporteChat";
import Pagamentos from "./Pagamentos";
import Documentos from "./Documentos";
import PerfilAluno from "./PerfilAluno";
import { ModernCarteirinha } from "@/components/portal/ModernCarteirinha";
import NotFound from "../admin/NotFound";

interface StudentData {
  id: number;
  name: string;
  email: string;
  cpf: string;
}

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  useEffect(() => {
    // Verificar se há dados do aluno no localStorage
    const token = localStorage.getItem('student_token');
    const data = localStorage.getItem('student_data');
    
    if (!token || !data) {
      navigate('/portal-aluno/login');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setStudentData(parsedData);
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      navigate('/portal-aluno/login');
    }
  }, [navigate]);

  if (!studentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando portal do aluno...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ModernStudentLayout studentData={studentData}>
      <Routes>
        <Route path="/" element={<StudentDashboard studentData={studentData} />} />
        <Route path="/cursos" element={<MeusCursos />} />
        <Route path="/disciplinas" element={<MinhasDisciplinas />} />
        <Route path="/avaliacoes" element={<MinhasAvaliacoes />} />
        <Route path="/certificados" element={<Certificados />} />
        <Route path="/suporte" element={<SuporteChat />} />
        <Route path="/pagamentos" element={<Pagamentos />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/perfil" element={<PerfilAluno />} />
        <Route path="/carteirinha" element={<ModernCarteirinha studentData={studentData} />} />
        <Route path="*" element={<StudentDashboard studentData={studentData} />} />
      </Routes>
    </ModernStudentLayout>
  );
}