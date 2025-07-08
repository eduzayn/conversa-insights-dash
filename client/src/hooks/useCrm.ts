import { useState, useEffect } from 'react';
import { CrmFunnel, Lead, CrmFilters, MoveLeadData, CrmTeam, CrmViewMode } from '@/types/crm';

// Mock data para demonstração
const mockTeams: CrmTeam[] = [
  {
    id: 'comercial',
    name: 'Comercial',
    description: 'Equipe responsável por vendas e captação de leads',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'suporte',
    name: 'Suporte', 
    description: 'Equipe de atendimento e suporte técnico',
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

// Mock data para demonstração - Funis da Companhia COMERCIAL
const mockFunnelsComercial: CrmFunnel[] = [
  {
    id: 'comercial',
    name: 'Funil Comercial',
    team: 'comercial',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-yellow-100 border-yellow-300',
        order: 1,
        leads: [
          {
            id: '1',
            name: 'João Silva',
            phone: '(11) 99999-9999',
            email: 'joao@email.com',
            course: 'Engenharia',
            status: 'novo-contato',
            assignedTo: 'user1',
            assignedToName: 'Ana Costa',
            companyAccount: 'COMERCIAL',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            lastInteraction: new Date('2024-01-15'),
            conversationId: 'conv1'
          },
          {
            id: '2',
            name: 'Maria Santos',
            phone: '(11) 88888-8888',
            course: 'Administração',
            status: 'novo-contato',
            companyAccount: 'COMERCIAL',
            createdAt: new Date('2024-01-14'),
            updatedAt: new Date('2024-01-14'),
            lastInteraction: new Date('2024-01-14')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-blue-100 border-blue-300',
        order: 2,
        leads: [
          {
            id: '3',
            name: 'Pedro Oliveira',
            phone: '(11) 77777-7777',
            course: 'Medicina',
            status: 'em-atendimento',
            assignedTo: 'user2',
            assignedToName: 'Carlos Lima',
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-16'),
            lastInteraction: new Date('2024-01-16'),
            conversationId: 'conv2'
          }
        ]
      },
      {
        id: 'aguardando-resposta',
        title: 'Aguardando Resposta',
        color: 'bg-orange-100 border-orange-300',
        order: 3,
        leads: []
      },
      {
        id: 'fechou-venda',
        title: 'Fechou Venda',
        color: 'bg-green-100 border-green-300',
        order: 4,
        leads: [
          {
            id: '4',
            name: 'Ana Ferreira',
            phone: '(11) 66666-6666',
            course: 'Direito',
            status: 'fechou-venda',
            assignedTo: 'user1',
            assignedToName: 'Ana Costa',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-17'),
            lastInteraction: new Date('2024-01-17')
          }
        ]
      },
      {
        id: 'perdeu',
        title: 'Perdeu',
        color: 'bg-red-100 border-red-300',
        order: 5,
        leads: []
      }
    ]
  },
  {
    id: 'suporte',
    name: 'Suporte',
    team: 'suporte',
    isActive: true,
    columns: [
      {
        id: 'novo-ticket',
        title: 'Novo Ticket',
        color: 'bg-purple-100 border-purple-300',
        order: 1,
        leads: []
      },
      {
        id: 'em-atendimento-suporte',
        title: 'Em Atendimento',
        color: 'bg-blue-100 border-blue-300',
        order: 2,
        leads: []
      },
      {
        id: 'resolvido',
        title: 'Resolvido',
        color: 'bg-green-100 border-green-300',
        order: 3,
        leads: []
      }
    ]
  }
];

// Mock data para demonstração - Funis da Companhia SUPORTE
const mockFunnelsSuporte: CrmFunnel[] = [
  {
    id: 'suporte',
    name: 'Funil Suporte',
    team: 'suporte',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-blue-100 border-blue-300',
        order: 1,
        leads: [
          {
            id: '5',
            name: 'Carlos Mendes',
            phone: '(11) 55555-5555',
            email: 'carlos@email.com',
            course: 'Pós-Graduação',
            status: 'novo-contato',
            assignedTo: 'user1',
            assignedToName: 'Miguel Ferreira',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            lastInteraction: new Date('2024-01-15'),
            conversationId: 'conv5'
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-green-100 border-green-300',
        order: 2,
        leads: [
          {
            id: '6',
            name: 'Ana Beatriz',
            phone: '(11) 44444-4444',
            course: 'Tutoria',
            status: 'em-atendimento',
            assignedTo: 'user2',
            assignedToName: 'Letícia Malf',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-16'),
            lastInteraction: new Date('2024-01-16'),
            conversationId: 'conv6'
          }
        ]
      },
      {
        id: 'resolvido',
        title: 'Resolvido',
        color: 'bg-purple-100 border-purple-300',
        order: 3,
        leads: [
          {
            id: '7',
            name: 'Pedro Costa',
            phone: '(11) 33333-3333',
            course: 'Documentação',
            status: 'resolvido',
            assignedTo: 'user3',
            assignedToName: 'Wendell Carioca',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-17'),
            lastInteraction: new Date('2024-01-17')
          }
        ]
      }
    ]
  }
];

export const useCrm = (filters: CrmFilters = {}) => {
  const [funnels, setFunnels] = useState<CrmFunnel[]>([]);
  const [teams, setTeams] = useState<CrmTeam[]>([]);
  const [activeFunnel, setActiveFunnel] = useState<string>('comercial');
  const [viewMode, setViewMode] = useState<CrmViewMode>('kanban');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados baseado na companhia
    setTimeout(() => {
      const selectedFunnels = filters.companyAccount === 'SUPORTE' ? mockFunnelsSuporte : mockFunnelsComercial;
      setFunnels(selectedFunnels);
      setTeams(mockTeams);
      setIsLoading(false);
    }, 1000);
  }, [filters.companyAccount]);

  const getFilteredFunnels = () => {
    if (!filters.team) return funnels;
    return funnels.filter(funnel => funnel.team === filters.team);
  };

  const getActiveFunnelData = () => {
    return funnels.find(funnel => funnel.id === activeFunnel) || null;
  };

  const getAllLeads = () => {
    const activeFunnelData = getActiveFunnelData();
    if (!activeFunnelData) return [];
    
    return activeFunnelData.columns.flatMap(column => column.leads);
  };

  const createTeam = (teamData: Omit<CrmTeam, 'id' | 'createdAt'>) => {
    const newTeam: CrmTeam = {
      ...teamData,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setTeams(prevTeams => [...prevTeams, newTeam]);
    return newTeam;
  };

  const updateTeam = (id: string, teamData: Partial<CrmTeam>) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === id ? { ...team, ...teamData } : team
      )
    );
  };

  const deleteTeam = (id: string) => {
    setTeams(prevTeams => prevTeams.filter(team => team.id !== id));
  };

  const moveLead = (moveData: MoveLeadData) => {
    setFunnels(prevFunnels => {
      return prevFunnels.map(funnel => {
        if (funnel.id !== activeFunnel) return funnel;

        const updatedColumns = funnel.columns.map(column => {
          // Remove lead da coluna origem
          if (column.id === moveData.fromColumnId) {
            return {
              ...column,
              leads: column.leads.filter(lead => lead.id !== moveData.leadId)
            };
          }
          
          // Adiciona lead na coluna destino
          if (column.id === moveData.toColumnId) {
            const leadToMove = funnel.columns
              .find(col => col.id === moveData.fromColumnId)
              ?.leads.find(lead => lead.id === moveData.leadId);
            
            if (leadToMove) {
              const updatedLead = {
                ...leadToMove,
                status: moveData.toColumnId,
                updatedAt: new Date()
              };
              
              const newLeads = [...column.leads];
              newLeads.splice(moveData.newIndex, 0, updatedLead);
              
              return {
                ...column,
                leads: newLeads
              };
            }
          }
          
          return column;
        });

        return {
          ...funnel,
          columns: updatedColumns
        };
      });
    });
  };

  const createLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setFunnels(prevFunnels => {
      return prevFunnels.map(funnel => {
        if (funnel.id !== activeFunnel) return funnel;

        const updatedColumns = funnel.columns.map(column => {
          if (column.order === 1) { // Adiciona na primeira coluna
            return {
              ...column,
              leads: [newLead, ...column.leads]
            };
          }
          return column;
        });

        return {
          ...funnel,
          columns: updatedColumns
        };
      });
    });

    return newLead;
  };

  return {
    funnels: getFilteredFunnels(),
    teams,
    activeFunnel,
    setActiveFunnel,
    activeFunnelData: getActiveFunnelData(),
    viewMode,
    setViewMode,
    allLeads: getAllLeads(),
    isLoading,
    moveLead,
    createLead,
    createTeam,
    updateTeam,
    deleteTeam
  };
};
