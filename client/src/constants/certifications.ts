/**
 * Constantes centralizadas para certificações
 * Elimina strings mágicas e melhora tipagem TypeScript
 */

// Status das certificações
export const STATUS = ['pendente', 'em_andamento', 'concluido'] as const;
export type Status = typeof STATUS[number];

// Estados financeiros
export const FINANCEIRO_STATUS = ['em_dia', 'pendente', 'atrasado'] as const;
export type FinanceiroStatus = typeof FINANCEIRO_STATUS[number];

// Status de documentação/plataforma
export const DOCUMENTACAO_STATUS = ['pendente', 'em_andamento', 'concluido'] as const;
export type DocumentacaoStatus = typeof DOCUMENTACAO_STATUS[number];

// Categorias de certificação (chave -> label)
export const CATEGORIAS = {
  pos: 'Pós-graduação',
  segunda: 'Segunda licenciatura',
  formacao_pedagogica: 'Form. Pedagógica',
  formacao_livre: 'Form. Livre',
  diplomacao: 'Diplom. Competência',
  eja: 'EJA',
  graduacao: 'Graduação',
  capacitacao: 'Capacitação',
  sequencial: 'Sequencial',
} as const;

export type CategoriaKey = keyof typeof CATEGORIAS;

// Configuração das abas com larguras mínimas
export const TABS_CONFIG = [
  { value: 'pos' as CategoriaKey, label: CATEGORIAS.pos, minW: 'min-w-[120px]' },
  { value: 'segunda' as CategoriaKey, label: CATEGORIAS.segunda, minW: 'min-w-[140px]' },
  { value: 'formacao_pedagogica' as CategoriaKey, label: CATEGORIAS.formacao_pedagogica, minW: 'min-w-[130px]' },
  { value: 'formacao_livre' as CategoriaKey, label: CATEGORIAS.formacao_livre, minW: 'min-w-[110px]' },
  { value: 'diplomacao' as CategoriaKey, label: CATEGORIAS.diplomacao, minW: 'min-w-[140px]' },
  { value: 'eja' as CategoriaKey, label: CATEGORIAS.eja, minW: 'min-w-[110px]' },
  { value: 'graduacao' as CategoriaKey, label: CATEGORIAS.graduacao, minW: 'min-w-[120px]' },
  { value: 'capacitacao' as CategoriaKey, label: CATEGORIAS.capacitacao, minW: 'min-w-[120px]' },
  { value: 'sequencial' as CategoriaKey, label: CATEGORIAS.sequencial, minW: 'min-w-[120px]' },
] as const;

// Status TCC, Práticas Pedagógicas e Estágio
export const REQUISITOS_STATUS = ['nao_possui', 'pendente', 'em_andamento', 'concluido'] as const;
export type RequisitosStatus = typeof REQUISITOS_STATUS[number];

// Filtros de período
export const FILTRO_PERIODO = {
  todos: 'Todos',
  ultimos_7_dias: 'Últimos 7 dias',
  ultimos_30_dias: 'Últimos 30 dias',
  ultimos_90_dias: 'Últimos 90 dias',
  personalizado: 'Período personalizado'
} as const;

export type FiltroPeriodo = keyof typeof FILTRO_PERIODO;

// Filtros de tipo de data
export const FILTRO_TIPO_DATA = {
  data_prevista: 'Data Prevista',
  inicio_certificacao: 'Início da Certificação'
} as const;

export type FiltroTipoData = keyof typeof FILTRO_TIPO_DATA;

// Helper para obter label de categoria
export const getCategoriaLabel = (key: CategoriaKey): string => CATEGORIAS[key];

// Helper para validar status
export const isValidStatus = (value: string): value is Status => 
  STATUS.includes(value as Status);

// Helper para validar categoria
export const isValidCategoria = (value: string): value is CategoriaKey => 
  value in CATEGORIAS;