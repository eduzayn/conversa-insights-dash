export interface Company {
  id: 'COMERCIAL' | 'SUPORTE';
  name: string;
  description: string;
  departments: Department[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
}

export const COMPANIES: Company[] = [
  {
    id: 'COMERCIAL',
    name: 'Companhia Comercial',
    description: 'Instância BotConversa para vendas e captação de leads',
    departments: [
      {
        id: 'comercial',
        name: 'Comercial',
        description: 'Vendas e captação de leads'
      }
    ]
  },
  {
    id: 'SUPORTE',
    name: 'Companhia Suporte',
    description: 'Instância BotConversa para suporte ao cliente',
    departments: [
      {
        id: 'comercial',
        name: 'Comercial',
        description: 'Atendimento comercial'
      },
      {
        id: 'cobranca',
        name: 'Cobrança',
        description: 'Gestão de cobrança e pagamentos'
      },
      {
        id: 'suporte',
        name: 'Suporte',
        description: 'Suporte técnico'
      },
      {
        id: 'tutoria',
        name: 'Tutoria',
        description: 'Apoio acadêmico'
      },
      {
        id: 'secretaria-pos',
        name: 'Secretaria Pós',
        description: 'Secretaria de pós-graduação'
      },
      {
        id: 'secretaria-segunda-graduacao',
        name: 'Secretaria Segunda Graduação',
        description: 'Secretaria de segunda graduação'
      },
      {
        id: 'suporte-unicv',
        name: 'Suporte UNICV',
        description: 'Suporte específico UNICV'
      },
      {
        id: 'financeiro',
        name: 'Financeiro',
        description: 'Gestão financeira'
      },
      {
        id: 'documentacao',
        name: 'Documentação',
        description: 'Gestão de documentos'
      }
    ]
  }
];

export const getCompanyById = (id: string): Company | undefined => {
  return COMPANIES.find(company => company.id === id);
};

export const getDepartmentsByCompany = (companyId: string): Department[] => {
  const company = getCompanyById(companyId);
  return company?.departments || [];
};