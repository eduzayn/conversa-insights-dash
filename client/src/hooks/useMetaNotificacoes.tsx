import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import io from "socket.io-client";

interface ConquistaMeta {
  id: string;
  tipo: 'individual' | 'team';
  nome: string;
  meta: string;
  periodo: 'daily' | 'weekly' | 'monthly';
  moedas: number;
  setor?: string;
  timestamp: number;
  goalId: number;
  userId: number | null;
  goalTitle: string;
  goalType: string;
  goalPeriod: string;
  goalReward: number;
  userName?: string;
  teamName?: string;
}

export const useMetaNotificacoes = () => {
  const [conquistas, setConquistas] = useState<ConquistaMeta[]>([]);
  const [conquistaAtual, setConquistaAtual] = useState<ConquistaMeta | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

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

  // Mostrar conquista específica
  const mostrarConquista = useCallback((conquista: ConquistaMeta) => {
    setConquistaAtual(conquista);
    setIsVisible(true);
    marcarComoMostrada(conquista.id);
  }, [marcarComoMostrada]);

  // Adicionar nova conquista
  const adicionarConquista = useCallback((conquista: ConquistaMeta | Omit<ConquistaMeta, 'id' | 'timestamp'>) => {
    let novaConquista: ConquistaMeta;
    
    if ('id' in conquista && 'timestamp' in conquista) {
      novaConquista = conquista;
    } else {
      novaConquista = {
        ...conquista,
        id: `${conquista.nome}-${conquista.meta}-${Date.now()}`,
        timestamp: Date.now(),
        goalId: 0,
        userId: null,
        goalTitle: conquista.meta,
        goalType: conquista.tipo,
        goalPeriod: conquista.periodo,
        goalReward: conquista.moedas,
      };
    }

    // Verificar se já foi mostrada hoje
    if (jaFoiMostrada(novaConquista.id)) {
      return;
    }

    setConquistas(prev => [...prev, novaConquista]);
    
    // Se não há conquista sendo exibida, mostrar esta
    if (!isVisible) {
      mostrarConquista(novaConquista);
    }
  }, [jaFoiMostrada, isVisible, mostrarConquista]);

  // Conectar ao WebSocket para escutar conquistas em tempo real
  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000');
    
    socket.on('goal_achieved', (data: { userId: number | null; achievement: any }) => {
      console.log('Conquista recebida via WebSocket:', data);
      
      // Verificar se a conquista é para o usuário atual ou para sua equipe
      const isForCurrentUser = data.userId === user.id || data.userId === null;
      
      if (isForCurrentUser) {
        const conquista: ConquistaMeta = {
          id: `${data.achievement.goalId}-${data.achievement.period}-${Date.now()}`,
          tipo: data.achievement.goalType as 'individual' | 'team',
          nome: data.achievement.userName || data.achievement.teamName || 'Equipe',
          meta: data.achievement.goalTitle,
          periodo: data.achievement.goalPeriod as 'daily' | 'weekly' | 'monthly',
          moedas: data.achievement.goalReward,
          setor: data.achievement.teamName,
          timestamp: Date.now(),
          goalId: data.achievement.goalId,
          userId: data.achievement.userId,
          goalTitle: data.achievement.goalTitle,
          goalType: data.achievement.goalType,
          goalPeriod: data.achievement.goalPeriod,
          goalReward: data.achievement.goalReward,
          userName: data.achievement.userName,
          teamName: data.achievement.teamName,
        };

        // Usar setTimeout para evitar problemas de dependência circular
        setTimeout(() => {
          adicionarConquista(conquista);
        }, 100);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, adicionarConquista]);

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
          periodo: 'daily' as const,
          moedas: 50,
          setor: 'Comercial'
        },
        {
          tipo: 'individual' as const,
          nome: 'João Lima',
          meta: '50 atendimentos concluídos',
          periodo: 'weekly' as const,
          moedas: 150,
          setor: 'Suporte'
        }
      ],
      equipe: [
        {
          tipo: 'team' as const,
          nome: 'Comercial',
          meta: 'R$ 50.000 em faturamento',
          periodo: 'monthly' as const,
          moedas: 500,
          setor: 'Comercial'
        },
        {
          tipo: 'team' as const,
          nome: 'Suporte',
          meta: '200 tickets resolvidos',
          periodo: 'weekly' as const,
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