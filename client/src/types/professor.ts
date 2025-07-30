// Tipos locais para o Portal do Professor para evitar problemas de import do schema

export interface SubjectContent {
  id: number;
  subjectId: number;
  professorId: number;
  titulo: string;
  tipo: "video" | "ebook" | "link" | "pdf";
  conteudo: string;
  descricao?: string;
  ordem: number;
  isActive: boolean;
  visualizacoes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  nome: string;
  codigo: string;
  descricao?: string;
}

export interface InsertSubjectContent {
  subjectId: number;
  professorId?: number;
  titulo: string;
  tipo: "video" | "ebook" | "link" | "pdf";
  conteudo: string;
  descricao?: string;
  ordem?: number;
  isActive?: boolean;
  visualizacoes?: number;
}