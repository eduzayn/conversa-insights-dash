
import { useState } from 'react';
import { Lead } from '@/types/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VoiceTranscription } from '@/components/common/VoiceTranscription';
import { toast } from 'sonner';

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const CreateLeadModal = ({ open, onOpenChange, onCreateLead }: CreateLeadModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: '',
    notes: '',
    source: '',
    assignedTo: '',
    assignedToName: ''
  });

  const coursesData = ['Engenharia', 'Medicina', 'Direito', 'Administração', 'Psicologia'];
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const attendantsData = [
    { id: 'user1', name: 'Ana Costa' },
    { id: 'user2', name: 'Carlos Lima' },
    { id: 'user3', name: 'Maria Silva' }
  ];
  const attendants = Array.isArray(attendantsData) ? attendantsData : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.course) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      course: formData.course,
      status: 'novo-contato',
      notes: formData.notes || undefined,
      source: formData.source || undefined,
      assignedTo: formData.assignedTo || undefined,
      assignedToName: formData.assignedToName || undefined
    };

    onCreateLead(leadData);
    
    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      course: '',
      notes: '',
      source: '',
      assignedTo: '',
      assignedToName: ''
    });
    
    onOpenChange(false);
    toast.success('Lead criado com sucesso!');
  };

  const handleAttendantChange = (attendantId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    setFormData(prev => ({
      ...prev,
      assignedTo: attendantId,
      assignedToName: attendant?.name || ''
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="course">Curso *</Label>
              <Select
                value={formData.course}
                onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Origem</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Ex: Site, Indicação, Whatsapp"
              />
            </div>
            
            <div>
              <Label htmlFor="assignedTo">Responsável</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={handleAttendantChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {attendants.map(attendant => (
                    <SelectItem key={attendant.id} value={attendant.id}>
                      {attendant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="notes">Observações</Label>
              <VoiceTranscription
                onTranscript={(transcript) => {
                  const currentValue = formData.notes || '';
                  const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
                  setFormData(prev => ({ ...prev, notes: newValue }));
                }}
              />
            </div>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informações adicionais sobre o lead"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Criar Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
