/**
 * Modal para cadastrar novo curso
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
  modalidade?: string;
}

export const NewCourseDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  modalidade
}: NewCourseDialogProps) => {
  const [courseData, setCourseData] = useState({ nome: '', cargaHoraria: '' });

  // Limpar dados quando o modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setCourseData({ nome: '', cargaHoraria: '' });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!courseData.nome || !courseData.cargaHoraria) {
      return;
    }
    
    // Validar se carga horária é um número válido
    const cargaHorariaNum = parseInt(courseData.cargaHoraria);
    if (isNaN(cargaHorariaNum) || cargaHorariaNum <= 0) {
      return;
    }
    
    onSubmit({
      nome: courseData.nome.trim(),
      cargaHoraria: courseData.cargaHoraria
    });
  };

  const handleClose = () => {
    setCourseData({ nome: '', cargaHoraria: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Curso</DialogTitle>
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
              onChange={(e) => setCourseData({ ...courseData, nome: e.target.value })}
              placeholder="Ex: Pós-Graduação em Educação Especial"
            />
          </div>
          
          <div>
            <Label htmlFor="new-course-carga">Carga Horária *</Label>
            <Input
              id="new-course-carga"
              type="number"
              value={courseData.cargaHoraria}
              onChange={(e) => setCourseData({ ...courseData, cargaHoraria: e.target.value })}
              placeholder="Ex: 1320"
            />
          </div>
          
          {modalidade && (
            <div className="text-sm text-gray-600">
              <strong>Modalidade:</strong> {modalidade}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !courseData.nome || !courseData.cargaHoraria} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? 'Criando...' : 'Criar Curso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};