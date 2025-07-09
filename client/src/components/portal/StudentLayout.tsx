import { ReactNode } from "react";
import { StudentSidebar } from "./StudentSidebar";

interface StudentLayoutProps {
  children: ReactNode;
  studentData: {
    name: string;
    email: string;
  };
}

export function StudentLayout({ children, studentData }: StudentLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <StudentSidebar studentData={studentData} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}