
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, Users, Settings } from 'lucide-react';
import { CrmTeam } from '@/types/crm';
import { toast } from 'sonner';

interface CrmSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: CrmTeam[];
  onCreateTeam: (team: Omit<CrmTeam, 'id' | 'createdAt'>) => void;
  onUpdateTeam: (id: string, team: Partial<CrmTeam>) => void;
  onDeleteTeam: (id: string) => void;
}

export const CrmSettingsModal = ({
  open,
  onOpenChange,
  teams,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam
}: CrmSettingsModalProps) => {
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [editingTeam, setEditingTeam] = useState<CrmTeam | null>(null);

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      toast.error('Nome da equipe é obrigatório');
      return;
    }

    onCreateTeam({
      name: newTeam.name.trim(),
      description: newTeam.description.trim(),
      isActive: true
    });

    setNewTeam({ name: '', description: '' });
    toast.success('Equipe criada com sucesso!');
  };

  const handleUpdateTeam = () => {
    if (!editingTeam || !editingTeam.name.trim()) {
      toast.error('Nome da equipe é obrigatório');
      return;
    }

    onUpdateTeam(editingTeam.id, {
      name: editingTeam.name.trim(),
      description: editingTeam.description?.trim(),
      isActive: editingTeam.isActive
    });

    setEditingTeam(null);
    toast.success('Equipe atualizada com sucesso!');
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Tem certeza que deseja excluir esta equipe?')) {
      onDeleteTeam(teamId);
      toast.success('Equipe excluída com sucesso!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do CRM
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teams">Equipes</TabsTrigger>
            <TabsTrigger value="general">Geral</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Equipe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team-name">Nome da Equipe</Label>
                    <Input
                      id="team-name"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      placeholder="Ex: Comercial, Suporte..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-description">Descrição</Label>
                    <Input
                      id="team-description"
                      value={newTeam.description}
                      onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                      placeholder="Descrição opcional"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateTeam} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Equipe
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Equipes Existentes ({teams.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{team.name}</h4>
                          <Badge variant={team.isActive ? 'default' : 'secondary'}>
                            {team.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {team.description && (
                          <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTeam(team)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhuma equipe criada ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Configurações gerais do CRM serão implementadas em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editingTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Editar Equipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    value={editingTeam.description || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateTeam} className="flex-1">
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setEditingTeam(null)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
