
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [newTeam, setNewTeam] = useState({ name: '', description: '', company: '' });
  const [editingTeam, setEditingTeam] = useState<CrmTeam | null>(null);

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      toast.error('Nome da equipe é obrigatório');
      return;
    }
    if (!newTeam.company.trim()) {
      toast.error('Selecione uma companhia');
      return;
    }

    onCreateTeam({
      name: newTeam.name.trim(),
      description: newTeam.description.trim(),
      isActive: true
    });

    setNewTeam({ name: '', description: '', company: '' });
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

        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies">Companhias</TabsTrigger>
            <TabsTrigger value="teams">Funis</TabsTrigger>
            <TabsTrigger value="general">Geral</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Companhias Configuradas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Companhia Comercial */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-800">Companhia Comercial</CardTitle>
                      <p className="text-sm text-blue-600">Instância BotConversa para vendas</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Funil:</span>
                          <span className="text-sm">Comercial</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Leads:</span>
                          <span className="text-sm">8 leads ativos</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Colunas:</span>
                          <span className="text-sm">5 status</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Companhia Suporte */}
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-purple-800">Companhia Suporte</CardTitle>
                      <p className="text-sm text-purple-600">Instância BotConversa para suporte</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Funil:</span>
                          <span className="text-sm">Comercial</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Leads:</span>
                          <span className="text-sm">12 leads ativos</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Departamentos:</span>
                          <span className="text-sm">9 departamentos</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Departamentos da Companhia Suporte */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Departamentos - Companhia Suporte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { name: 'Comercial', members: 3, leads: 3 },
                        { name: 'Cobrança', members: 2, leads: 2 },
                        { name: 'Suporte', members: 1, leads: 1 },
                        { name: 'Tutoria', members: 2, leads: 2 },
                        { name: 'Secretaria Pós', members: 2, leads: 2 },
                        { name: 'Secretaria Segunda Graduação', members: 2, leads: 2 },
                        { name: 'Suporte UNICV', members: 1, leads: 1 },
                        { name: 'Financeiro', members: 1, leads: 1 },
                        { name: 'Documentação', members: 1, leads: 1 }
                      ].map((dept) => (
                        <Card key={dept.name} className="border-gray-200">
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm mb-2">{dept.name}</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Membros:</span>
                                <span>{dept.members}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Leads:</span>
                                <span>{dept.leads}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Funil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team-name">Nome do Funil</Label>
                    <Input
                      id="team-name"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      placeholder="Ex: Vendas, Atendimento..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-company">Companhia</Label>
                    <Select value={newTeam.company || ''} onValueChange={(value) => setNewTeam({ ...newTeam, company: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a companhia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMERCIAL">Comercial</SelectItem>
                        <SelectItem value="SUPORTE">Suporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <Button onClick={handleCreateTeam} className="w-full bg-slate-800 hover:bg-slate-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Funil
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Funis Existentes ({teams.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <Card key={team.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{team.name}</h4>
                              <Badge variant={team.isActive ? 'default' : 'secondary'} className="bg-green-100 text-green-800">
                                {team.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {team.company && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {team.company}
                                </Badge>
                              )}
                            </div>
                            {team.description && (
                              <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                            )}
                            <div className="flex gap-4 text-sm text-gray-500">
                              <span>• 5 colunas de status</span>
                              <span>• {team.id === 'comercial' ? '8' : '12'} leads ativos</span>
                              <span>• Integração BotConversa</span>
                            </div>
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
                      </CardContent>
                    </Card>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum funil criado ainda
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
