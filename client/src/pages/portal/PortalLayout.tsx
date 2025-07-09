import { useState, useEffect } from "react";
import { Route, useLocation } from "wouter";
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
  const [location, setLocation] = useLocation();
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
  
  const renderContent = () => {
    switch (location) {
      case '/portal':
        return <StudentDashboard studentData={studentData} />;
      case '/portal/cursos':
        return <MeusCursos />;
      case '/portal/disciplinas':
        return <MinhasDisciplinas />;
      case '/portal/avaliacoes':
        return <MinhasAvaliacoes />;
      case '/portal/certificados':
        return <Certificados />;
      case '/portal/suporte':
        return <SuporteChat />;
      case '/portal/pagamentos':
        return <Pagamentos />;
      case '/portal/documentos':
        return <Documentos />;
      case '/portal/perfil':
        return <PerfilAluno />;
      case '/portal/carteirinha':
        return <ModernCarteirinha studentData={studentData} />;
      default:
        return <StudentDashboard studentData={studentData} />;
    }
  };

  return (
    <ModernStudentLayout studentData={studentData}>
      {renderContent()}
    </ModernStudentLayout>
  );
}