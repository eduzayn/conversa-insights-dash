import { useState, useEffect } from 'react';
import { CrmFunnel, Lead, CrmFilters, MoveLeadData, CrmTeam, CrmViewMode } from '@/types/crm';

// Mock data para demonstração
const mockTeams: CrmTeam[] = [
  {
    id: 'comercial',
    name: 'Comercial',
    description: 'Equipe responsável por vendas e captação de leads',
    company: 'COMERCIAL',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'suporte',
    name: 'Suporte', 
    description: 'Equipe de atendimento e suporte técnico',
    company: 'SUPORTE',
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

// Mock data para demonstração - Funis da Companhia COMERCIAL
const mockFunnelsComercial: CrmFunnel[] = [
  {
    id: 'comercial',
    name: 'Comercial',
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
    id: 'comercial-suporte',
    name: 'Comercial',
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
            id: 'sup-1',
            name: 'Cliente Comercial 1',
            phone: '(11) 91111-1111',
            email: 'cliente1@email.com',
            course: 'Consulta Comercial',
            status: 'novo-contato',
            assignedTo: 'erick',
            assignedToName: 'Erick Moreira',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            lastInteraction: new Date('2024-01-15')
          },
          {
            id: 'sup-1b',
            name: 'Cliente Comercial 2',
            phone: '(11) 91122-1122',
            email: 'cliente2@email.com',
            course: 'Consulta Comercial',
            status: 'novo-contato',
            assignedTo: 'amanda',
            assignedToName: 'Amanda Monique',
            companyAccount: 'SUPORTE',
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
            id: 'sup-1c',
            name: 'Cliente Comercial 3',
            phone: '(11) 91133-1133',
            email: 'cliente3@email.com',
            course: 'Consulta Comercial',
            status: 'em-atendimento',
            assignedTo: 'rian',
            assignedToName: 'Rian Moreira',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-16'),
            lastInteraction: new Date('2024-01-16')
          }
        ]
      },
      {
        id: 'resolvido',
        title: 'Resolvido',
        color: 'bg-green-100 border-green-300',
        order: 3,
        leads: []
      }
    ]
  },
  {
    id: 'cobranca',
    name: 'Cobrança',
    team: 'cobranca',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-red-100 border-red-300',
        order: 1,
        leads: [
          {
            id: 'sup-2',
            name: 'Cliente Cobrança 1',
            phone: '(11) 92222-2222',
            email: 'cliente.cobranca1@email.com',
            course: 'Cobrança',
            status: 'novo-contato',
            assignedTo: 'camila',
            assignedToName: 'Camila Aparecida',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-14'),
            updatedAt: new Date('2024-01-14'),
            lastInteraction: new Date('2024-01-14')
          },
          {
            id: 'sup-2b',
            name: 'Cliente Cobrança 2',
            phone: '(11) 92233-2233',
            email: 'cliente.cobranca2@email.com',
            course: 'Cobrança',
            status: 'novo-contato',
            assignedTo: 'tamires',
            assignedToName: 'Tamires Kele',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-13'),
            lastInteraction: new Date('2024-01-13')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-orange-100 border-orange-300',
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
  },
  {
    id: 'suporte-tecnico',
    name: 'Suporte',
    team: 'suporte',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-purple-100 border-purple-300',
        order: 1,
        leads: [
          {
            id: 'sup-3',
            name: 'Joilson Ferreira',
            phone: '(11) 93333-3333',
            email: 'joilson@email.com',
            course: 'Suporte Técnico',
            status: 'novo-contato',
            assignedTo: 'user3',
            assignedToName: 'Joilson Ferreira',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-13'),
            lastInteraction: new Date('2024-01-13')
          }
        ]
      },
      {
        id: 'em-atendimento',
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
  },
  {
    id: 'tutoria',
    name: 'Tutoria',
    team: 'tutoria',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-teal-100 border-teal-300',
        order: 1,
        leads: [
          {
            id: 'sup-4',
            name: 'Miguel Ferreira',
            phone: '(11) 94444-4444',
            email: 'miguel@email.com',
            course: 'Tutoria',
            status: 'novo-contato',
            assignedTo: 'user4',
            assignedToName: 'Miguel Ferreira',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-12'),
            lastInteraction: new Date('2024-01-12')
          },
          {
            id: 'sup-5',
            name: 'Letícia Malf 24',
            phone: '(11) 95555-5555',
            email: 'leticia24@email.com',
            course: 'Tutoria',
            status: 'novo-contato',
            assignedTo: 'user5',
            assignedToName: 'Letícia Malf 24',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-11'),
            updatedAt: new Date('2024-01-11'),
            lastInteraction: new Date('2024-01-11')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-cyan-100 border-cyan-300',
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
  },
  {
    id: 'secretaria-pos',
    name: 'Secretaria Pós',
    team: 'secretaria-pos',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-indigo-100 border-indigo-300',
        order: 1,
        leads: [
          {
            id: 'sup-6',
            name: 'Erika Brasil',
            phone: '(11) 96666-6666',
            email: 'erika@email.com',
            course: 'Secretaria Pós',
            status: 'novo-contato',
            assignedTo: 'user6',
            assignedToName: 'Erika Brasil',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
            lastInteraction: new Date('2024-01-10')
          },
          {
            id: 'sup-7',
            name: 'Erika Brasil 68',
            phone: '(11) 97777-7777',
            email: 'erika68@email.com',
            course: 'Secretaria Pós',
            status: 'novo-contato',
            assignedTo: 'user7',
            assignedToName: 'Erika Brasil 68',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-09'),
            updatedAt: new Date('2024-01-09'),
            lastInteraction: new Date('2024-01-09')
          }
        ]
      },
      {
        id: 'em-atendimento',
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
  },
  {
    id: 'secretaria-segunda',
    name: 'Secretaria Segunda Graduação',
    team: 'secretaria-segunda',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-pink-100 border-pink-300',
        order: 1,
        leads: [
          {
            id: 'sup-8',
            name: 'Danise Torres',
            phone: '(11) 98888-8888',
            email: 'danise@email.com',
            course: 'Segunda Graduação',
            status: 'novo-contato',
            assignedTo: 'user8',
            assignedToName: 'Danise Torres',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-08'),
            updatedAt: new Date('2024-01-08'),
            lastInteraction: new Date('2024-01-08')
          },
          {
            id: 'sup-9',
            name: 'Cristina Rafael',
            phone: '(11) 99999-9999',
            email: 'cristina@email.com',
            course: 'Segunda Graduação',
            status: 'novo-contato',
            assignedTo: 'user9',
            assignedToName: 'Cristina Rafael',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-07'),
            updatedAt: new Date('2024-01-07'),
            lastInteraction: new Date('2024-01-07')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-rose-100 border-rose-300',
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
  },
  {
    id: 'suporte-unicv',
    name: 'Suporte UNICV',
    team: 'suporte-unicv',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-slate-100 border-slate-300',
        order: 1,
        leads: [
          {
            id: 'sup-10',
            name: 'Aiara Mattos',
            phone: '(11) 91010-1010',
            email: 'aiara@universidadebusf.edu.br',
            course: 'Suporte UNICV',
            status: 'novo-contato',
            assignedTo: 'user10',
            assignedToName: 'Aiara Mattos',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-06'),
            updatedAt: new Date('2024-01-06'),
            lastInteraction: new Date('2024-01-06')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-gray-100 border-gray-300',
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
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    team: 'financeiro',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-emerald-100 border-emerald-300',
        order: 1,
        leads: [
          {
            id: 'sup-11',
            name: 'Kamilla Bellara',
            phone: '(11) 91111-1111',
            email: 'kamilla@email.com',
            course: 'Financeiro',
            status: 'novo-contato',
            assignedTo: 'user11',
            assignedToName: 'Kamilla Bellara',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-05'),
            lastInteraction: new Date('2024-01-05')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-green-100 border-green-300',
        order: 2,
        leads: []
      },
      {
        id: 'resolvido',
        title: 'Resolvido',
        color: 'bg-lime-100 border-lime-300',
        order: 3,
        leads: []
      }
    ]
  },
  {
    id: 'documentacao',
    name: 'Documentação',
    team: 'documentacao',
    isActive: true,
    columns: [
      {
        id: 'novo-contato',
        title: 'Novo Contato',
        color: 'bg-amber-100 border-amber-300',
        order: 1,
        leads: [
          {
            id: 'sup-12',
            name: 'Wendell Carioca',
            phone: '(11) 91212-1212',
            email: 'wendell@email.com',
            course: 'Documentação',
            status: 'novo-contato',
            assignedTo: 'user12',
            assignedToName: 'Wendell Carioca',
            companyAccount: 'SUPORTE',
            createdAt: new Date('2024-01-04'),
            updatedAt: new Date('2024-01-04'),
            lastInteraction: new Date('2024-01-04')
          }
        ]
      },
      {
        id: 'em-atendimento',
        title: 'Em Atendimento',
        color: 'bg-yellow-100 border-yellow-300',
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
      // Definir o funil ativo como o primeiro da lista
      if (selectedFunnels.length > 0) {
        setActiveFunnel(selectedFunnels[0].id);
      }
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
