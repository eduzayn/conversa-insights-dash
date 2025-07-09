import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ModernStudentLayout } from "@/components/portal/ModernStudentLayout";
import { StudentDashboard } from "@/components/portal/StudentDashboard";

interface StudentData {
  id: number;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
  matriculaAtiva: boolean;
  documentacaoStatus?: string;
}

export default function StudentPortal() {
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
      setStudentData(JSON.parse(data));
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      setLocation('/portal-aluno/login');
    }
  }, [setLocation]);

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando portal do aluno...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Redirecionar para /portal para usar o layout correto
    if (studentData) {
      setLocation('/portal');
    }
  }, [studentData, setLocation]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando para o portal...</p>
      </div>
    </div>
  );
}