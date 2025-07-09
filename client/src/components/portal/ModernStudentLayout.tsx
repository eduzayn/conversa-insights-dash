import { useState } from "react";
import { ModernStudentSidebar } from "./ModernStudentSidebar";

interface StudentData {
  id: number;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
  matriculaAtiva: boolean;
  documentacaoStatus?: string;
}

interface ModernStudentLayoutProps {
  children?: React.ReactNode;
  studentData: StudentData;
}

export function ModernStudentLayout({ children, studentData }: ModernStudentLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <ModernStudentSidebar 
        studentData={studentData} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">Portal do Aluno</h1>
                <div className="h-4 w-px bg-gray-300"></div>
                <p className="text-sm text-gray-600">Bem-vindo, {studentData.name}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}