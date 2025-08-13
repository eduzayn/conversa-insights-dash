
import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { KanbanColumn } from '@/components/crm/KanbanColumn';
import { CrmFilters } from '@/components/crm/CrmFilters';
import { CrmListView } from '@/components/crm/CrmListView';
import { CreateLeadModal } from '@/components/crm/CreateLeadModal';
import { CrmSettingsModal } from '@/components/crm/CrmSettingsModal';
import { useCrm } from '@/hooks/useCrm';
import { CrmFilters as CrmFiltersType } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, BarChart3, Settings, Kanban, List } from 'lucide-react';
import { toast } from 'sonner';

const Crm = () => {
  const [filters, setFilters] = useState<CrmFiltersType>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<'COMERCIAL' | 'SUPORTE'>('COMERCIAL');
  const [activeAttendant, setActiveAttendant] = useState<string>('todos');
  
  const { 
    funnels, 
    teams,
    activeFunnel, 
    setActiveFunnel, 
    activeFunnelData,
    viewMode,
    setViewMode,
    allLeads,
    isLoading, 
    moveLead, 
    createLead,
    createTeam,
    updateTeam,
    deleteTeam
  } = useCrm({ ...filters, companyAccount: activeCompany });

  // Resetar filtro de atendente quando funil ou companhia muda
  useEffect(() => {
    setActiveAttendant('todos');
  }, [activeFunnel, activeCompany]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveLead({
      leadId: draggableId,
      fromColumnId: source.droppableId,
      toColumnId: destination.droppableId,
      newIndex: destination.index
    });

    toast.success('Lead movido com sucesso!');
  };

  const getAvailableData = () => {
    const teamNames = Array.from(new Set(funnels.map(f => f.team)));
    const attendants = Array.from(new Set(
      funnels.flatMap(f => 
        f.columns.flatMap(c => 
          c.leads.map(l => l.assignedToName).filter(Boolean)
        )
      )
    ));
    const courses = Array.from(new Set(
      funnels.flatMap(f => 
        f.columns.flatMap(c => 
          c.leads.map(l => l.course)
        )
      )
    ));

    return { teams: teamNames, attendants, courses };
  };

  const { teams: teamNames, attendants, courses } = getAvailableData();

  const getTotalLeads = () => {
    if (!activeFunnelData) return 0;
    return activeFunnelData.columns.reduce((total, column) => total + column.leads.length, 0);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
          <div className="space-y-4 md:space-y-6">
            {/* Header do CRM */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  CRM - Painel Kanban
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie seus leads e oportunidades de forma visual
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Select value={activeCompany} onValueChange={(value: "COMERCIAL" | "SUPORTE") => setActiveCompany(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Selecione a companhia">
                      {activeCompany === 'COMERCIAL' && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Companhia Comercial
                        </div>
                      )}
                      {activeCompany === 'SUPORTE' && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Companhia Suporte
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMERCIAL">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Companhia Comercial
                      </div>
                    </SelectItem>
                    <SelectItem value="SUPORTE">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Companhia Suporte
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={activeFunnel} onValueChange={setActiveFunnel}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Selecione o funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnels.map(funnel => (
                      <SelectItem key={funnel.id} value={funnel.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {funnel.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={activeAttendant} onValueChange={setActiveAttendant}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Selecione o atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Todos os atendentes
                      </div>
                    </SelectItem>
                    {activeFunnelData?.columns?.flatMap(column => 
                      column.leads?.map(lead => lead.assignedToName).filter(Boolean) || []
                    ).filter((name, index, array) => array.indexOf(name) === index)
                    .map(attendantName => (
                      <SelectItem key={attendantName} value={attendantName}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {attendantName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={() => setIsSettingsModalOpen(true)} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            {activeFunnelData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Total de Leads</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{getTotalLeads()}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Funil Ativo</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-1">{activeFunnelData.name}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Etapas</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{activeFunnelData.columns.length}</p>
                </div>
              </div>
            )}

            {/* Filtros */}
            <CrmFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableTeams={teamNames}
              availableAttendants={attendants}
              availableCourses={courses}
            />

            {/* Tabs para alternar entre Kanban e Lista */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'kanban' | 'list')}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanban" className="mt-4">
                {activeFunnelData && (
                  <div className="bg-white p-4 rounded-lg border">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {activeFunnelData.columns
                          .sort((a, b) => a.order - b.order)
                          .map((column, index) => {
                            // Filtrar leads por atendente se não for "todos"
                            const filteredLeads = activeAttendant === 'todos' 
                              ? column.leads 
                              : column.leads?.filter(lead => lead.assignedToName === activeAttendant) || [];
                            
                            return (
                              <KanbanColumn
                                key={column.id}
                                column={{ ...column, leads: filteredLeads }}
                                index={index}
                              />
                            );
                          })}
                      </div>
                    </DragDropContext>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list" className="mt-4">
                <CrmListView leads={allLeads} />
              </TabsContent>
            </Tabs>
          </div>

        <CreateLeadModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateLead={createLead}
        />

        <CrmSettingsModal
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          teams={teams}
          onCreateTeam={createTeam}
          onUpdateTeam={updateTeam}
          onDeleteTeam={deleteTeam}
        />
      </div>
    </AdminLayout>
  );
};

export default Crm;
