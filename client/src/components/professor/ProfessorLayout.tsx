import { ReactNode } from "react";
import { ProfessorSidebar } from "./ProfessorSidebar";

interface ProfessorData {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface ProfessorLayoutProps {
  children: ReactNode;
  professorData: ProfessorData;
}

export function ProfessorLayout({ children, professorData }: ProfessorLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <ProfessorSidebar professorData={professorData} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}