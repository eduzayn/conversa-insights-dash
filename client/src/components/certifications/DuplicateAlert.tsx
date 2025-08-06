/**
 * Alerta de certificações duplicadas
 * 
 * Mostra um alerta quando são detectadas certificações similares/duplicadas
 * baseadas no algoritmo de detecção de duplicatas
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Certification } from '@shared/schema';

interface DuplicateAlertProps {
  duplicates: { [key: string]: Certification[] };
}

export const DuplicateAlert = ({ duplicates }: DuplicateAlertProps) => {
  const duplicateCount = Object.keys(duplicates).length;

  if (duplicateCount === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <strong>Atenção:</strong> Detectados {duplicateCount} {duplicateCount === 1 ? 'aluno com cursos similares' : 'alunos com cursos similares'}. 
        {Object.entries(duplicates).map(([key, certs]) => {
          const aluno = certs[0].aluno;
          const cursos = certs.map(c => c.curso).join(', ');
          return ` ${aluno}: ${cursos}.`;
        }).join('')}
      </AlertDescription>
    </Alert>
  );
};