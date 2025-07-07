
import { useState, useCallback } from "react";

interface ConquistaMeta {
  id: string;
  tipo: 'individual' | 'equipe';
  nome: string;
  meta: string;
  periodo: 'diária' | 'semanal' | 'mensal';
  moedas: number;
  setor?: string;
  timestamp: number;
}

export const useMetaNotificacoes = () => {
  const [conquistas, setConquistas] = useState<ConquistaMeta[]>([]);
  const [conquistaAtual, setConquistaAtual] = useState<ConquistaMeta | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Verificar se a conquista já foi mostrada hoje
  const jaFoiMostrada = useCallback((conquistaId: string) => {
    const hoje = new Date().toDateString();
    const conquistasMostradas = JSON.parse(
      localStorage.getItem('conquistasMostradas') || '{}'
    );
    
    return conquistasMostradas[hoje]?.includes(conquistaId) || false;
  }, []);

  // Marcar conquista como mostrada
  const marcarComoMostrada = useCallback((conquistaId: string) => {
    const hoje = new Date().toDateString();
    const conquistasMostradas = JSON.parse(
      localStorage.getItem('conquistasMostradas') || '{}'
    );
    
    if (!conquistasMostradas[hoje]) {
      conquistasMostradas[hoje] = [];
    }
    
    conquistasMostradas[hoje].push(conquistaId);
    localStorage.setItem('conquistasMostradas', JSON.stringify(conquistasMostradas));
  }, []);

  // Adicionar nova conquista
  const adicionarConquista = useCallback((conquista: Omit<ConquistaMeta, 'id' | 'timestamp'>) => {
    const novaConquista: ConquistaMeta = {
      ...conquista,
      id: `${conquista.nome}-${conquista.meta}-${Date.now()}`,
      timestamp: Date.now()
    };

    // Verificar se já foi mostrada hoje
    if (jaFoiMostrada(novaConquista.id)) {
      return;
    }

    setConquistas(prev => [...prev, novaConquista]);
    
    // Se não há conquista sendo exibida, mostrar esta
    if (!isVisible) {
      mostrarConquista(novaConquista);
    }
  }, [jaFoiMostrada, isVisible]);

  // Mostrar conquista específica
  const mostrarConquista = useCallback((conquista: ConquistaMeta) => {
    setConquistaAtual(conquista);
    setIsVisible(true);
    marcarComoMostrada(conquista.id);
  }, [marcarComoMostrada]);

  // Fechar notificação atual
  const fecharNotificacao = useCallback(() => {
    setIsVisible(false);
    setConquistaAtual(null);

    // Mostrar próxima conquista na fila, se houver
    setTimeout(() => {
      setConquistas(prev => {
        const proximasConquistas = prev.filter(c => c.id !== conquistaAtual?.id);
        
        if (proximasConquistas.length > 0) {
          const proxima = proximasConquistas[0];
          mostrarConquista(proxima);
          return proximasConquistas;
        }
        
        return proximasConquistas;
      });
    }, 500);
  }, [conquistaAtual, mostrarConquista]);

  // Simular conquista de meta (para testes)
  const simularConquista = useCallback((tipo: 'individual' | 'equipe' = 'individual') => {
    const exemplos = {
      individual: [
        {
          tipo: 'individual' as const,
          nome: 'Maria Souza',
          meta: '10 vendas realizadas',
          periodo: 'diária' as const,
          moedas: 50,
          setor: 'Comercial'
        },
        {
          tipo: 'individual' as const,
          nome: 'João Lima',
          meta: '50 atendimentos concluídos',
          periodo: 'semanal' as const,
          moedas: 150,
          setor: 'Suporte'
        }
      ],
      equipe: [
        {
          tipo: 'equipe' as const,
          nome: 'Comercial',
          meta: 'R$ 50.000 em faturamento',
          periodo: 'mensal' as const,
          moedas: 500,
          setor: 'Comercial'
        },
        {
          tipo: 'equipe' as const,
          nome: 'Suporte',
          meta: '200 tickets resolvidos',
          periodo: 'semanal' as const,
          moedas: 300,
          setor: 'Suporte'
        }
      ]
    };

    const exemplo = exemplos[tipo][Math.floor(Math.random() * exemplos[tipo].length)];
    adicionarConquista(exemplo);
  }, [adicionarConquista]);

  return {
    conquistaAtual,
    isVisible,
    adicionarConquista,
    fecharNotificacao,
    simularConquista
  };
};
