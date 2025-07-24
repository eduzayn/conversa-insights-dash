import { Badge } from "@/components/ui/badge";

interface StatusConfig {
  label: string;
  className: string;
  dotColor: string;
}

const DEFAULT_STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Status de negociações
  'aguardando_pagamento': {
    label: 'Aguardando pagamento',
    className: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  'recebido': {
    label: 'Recebido',
    className: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  'acordo_quebrado': {
    label: 'Acordo quebrado',
    className: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  // Status de propostas
  'pendente': {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  'enviada': {
    label: 'Enviada',
    className: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500'
  },
  'aceita': {
    label: 'Aceita',
    className: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  'rejeitada': {
    label: 'Rejeitada',
    className: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  // Status de certificações
  'em_andamento': {
    label: 'Em Andamento',
    className: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500'
  },
  'concluido': {
    label: 'Concluído',
    className: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  'cancelado': {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  'em_atraso': {
    label: 'Em Atraso',
    className: 'bg-orange-100 text-orange-800',
    dotColor: 'bg-orange-500'
  },
  // Status acadêmicos
  'nao_possui': {
    label: 'Não Possui',
    className: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500'
  },
  'aprovado': {
    label: 'Aprovado',
    className: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  'reprovado': {
    label: 'Reprovado',
    className: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  },
  'em_correcao': {
    label: 'Em Correção',
    className: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  // Status de quitações
  'quitado': {
    label: 'Quitado',
    className: 'bg-green-50 text-green-700 border border-green-200',
    dotColor: 'bg-green-400'
  }
};

interface StatusBadgeProps {
  status: string | undefined | null;
  customConfigs?: Record<string, StatusConfig>;
  showDot?: boolean;
}

/**
 * Componente consolidado para badges de status
 * Elimina duplicação de lógica de status entre páginas
 */
export function StatusBadge({ 
  status, 
  customConfigs = {}, 
  showDot = true 
}: StatusBadgeProps) {
  if (!status || typeof status !== 'string') {
    return (
      <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        {showDot && <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
        Indefinido
      </Badge>
    );
  }

  const allConfigs = { ...DEFAULT_STATUS_CONFIGS, ...customConfigs };
  const config = allConfigs[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500'
  };

  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      {showDot && <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>}
      {config.label}
    </Badge>
  );
}