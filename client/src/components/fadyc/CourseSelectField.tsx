/**
 * Componente de seleção de curso com autocomplete para FADYC
 * 
 * Permite buscar cursos existentes e adicionar novos cursos
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCursosFadyc } from '@/hooks/useCursosFadyc';
import { NewCourseDialog } from '../fadyc/NewCourseDialog';
import type { CursoFadyc } from '@shared/schema';

interface CourseSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  categoria: 'pos_graduacao' | 'musica';
  disabled?: boolean;
}

export const CourseSelectField = ({
  value,
  onChange,
  categoria,
  disabled = false
}: CourseSelectFieldProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [newCourseDialogOpen, setNewCourseDialogOpen] = useState(false);

  const { cursos, isLoading, createCurso, isCreating } = useCursosFadyc(categoria);

  const handleCourseSelect = (courseName: string) => {
    onChange(courseName);
    setSearchOpen(false);
  };

  const handleNewCourse = (courseData: { nome: string; cargaHoraria: string }) => {
    createCurso({
      nome: courseData.nome,
      categoria,
      cargaHoraria: parseInt(courseData.cargaHoraria) || 0,
      area: categoria === 'pos_graduacao' ? 'Educação' : 'Música',
    });
    setNewCourseDialogOpen(false);
    onChange(courseData.nome);
  };

  return (
    <>
      <div>
        <Label htmlFor="curso">Curso *</Label>
        <div className="flex gap-2">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={searchOpen}
                className="flex-1 justify-between text-left"
                disabled={disabled}
              >
                <span className="truncate">{value || "Selecione um curso..."}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0">
              <Command>
                <CommandInput placeholder="Buscar curso..." />
                <CommandList className="max-h-60">
                  <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                  <CommandGroup>
                    {cursos.map((curso) => (
                      <CommandItem
                        key={curso.id}
                        value={curso.nome}
                        onSelect={handleCourseSelect}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value === curso.nome ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{curso.nome}</span>
                          {curso.cargaHoraria && (
                            <span className="text-xs text-gray-500">{curso.cargaHoraria}h</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setNewCourseDialogOpen(true)}
            title="Adicionar novo curso"
            className="shrink-0"
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <NewCourseDialog
        isOpen={newCourseDialogOpen}
        onOpenChange={setNewCourseDialogOpen}
        onSubmit={handleNewCourse}
        isSubmitting={isCreating}
        categoria={categoria}
      />
    </>
  );
};