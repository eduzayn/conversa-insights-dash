import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { StudentLayout } from "@/components/portal/StudentLayout";
import MeusCursos from "./portal/MeusCursos";
import MinhasDisciplinas from "./portal/MinhasDisciplinas";
import MinhasAvaliacoes from "./portal/MinhasAvaliacoes";
import Certificados from "./portal/Certificados";
import SuporteChat from "./portal/SuporteChat";
import Pagamentos from "./portal/Pagamentos";
import Documentos from "./portal/Documentos";
import PerfilAluno from "./portal/PerfilAluno";
import Carteirinha from "./portal/Carteirinha";
import NotFound from "./NotFound";

interface StudentData {
  id: number;
  name: string;
  email: string;
  cpf: string;
}

export default function PortalLayout() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  useEffect(() => {
    // Verificar se há dados do aluno no localStorage
    const token = localStorage.getItem('student_token');
    const data = localStorage.getItem('student_data');
    
    if (!token || !data) {
      setLocation('/portal-aluno/login');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setStudentData(parsedData);
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      setLocation('/portal-aluno/login');
    }
  }, [setLocation]);

  if (!studentData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <StudentLayout studentData={studentData}>
      <Routes>
        <Route path="cursos" element={<MeusCursos />} />
        <Route path="disciplinas" element={<MinhasDisciplinas />} />
        <Route path="avaliacoes" element={<MinhasAvaliacoes />} />
        <Route path="certificados" element={<Certificados />} />
        <Route path="suporte" element={<SuporteChat />} />
        <Route path="pagamentos" element={<Pagamentos />} />
        <Route path="documentos" element={<Documentos />} />
        <Route path="perfil" element={<PerfilAluno />} />
        <Route path="carteirinha" element={<Carteirinha />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </StudentLayout>
  );
}