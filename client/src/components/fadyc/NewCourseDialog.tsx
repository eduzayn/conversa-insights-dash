/**
 * Modal para criar novo curso FADYC
 * 
 * Permite criar um novo curso quando o curso desejado não existe
 * na lista de cursos pré-cadastrados
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface NewCourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (courseData: { nome: string; cargaHoraria: string }) => void;
  isSubmitting: boolean;
  categoria: 'pos_graduacao' | 'musica';
}

export const NewCourseDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  categoria
}: NewCourseDialogProps) => {
  const [courseData, setCourseData] = useState({ nome: '', cargaHoraria: '' });

  // Limpar dados quando o modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setCourseData({ nome: '', cargaHoraria: '' });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!courseData.nome.trim()) {
      return;
    }
    
    // Validar se carga horária é um número válido (opcional)
    if (courseData.cargaHoraria && (isNaN(parseInt(courseData.cargaHoraria)) || parseInt(courseData.cargaHoraria) <= 0)) {
      return;
    }
    
    onSubmit({
      nome: courseData.nome.trim(),
      cargaHoraria: courseData.cargaHoraria || '0'
    });
  };

  const getCategoriaLabel = () => {
    return categoria === 'pos_graduacao' ? 'Pós-Graduação' : 'Música';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Curso - {getCategoriaLabel()}</DialogTitle>
          <DialogDescription>
            Cadastre um novo curso para adicionar à lista de opções
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-course-nome">Nome do Curso *</Label>
            <Input
              id="new-course-nome"
              value={courseData.nome}
              onChange={(e) => setCourseData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome do curso"
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="new-course-carga">Carga Horária (opcional)</Label>
            <Input
              id="new-course-carga"
              type="number"
              value={courseData.cargaHoraria}
              onChange={(e) => setCourseData(prev => ({ ...prev, cargaHoraria: e.target.value }))}
              placeholder="Ex: 360"
              min="0"
            />
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!courseData.nome.trim() || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};