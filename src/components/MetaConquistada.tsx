
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Coins } from "lucide-react";

interface MetaConquistadaProps {
  isVisible: boolean;
  onClose: () => void;
  conquista: {
    tipo: 'individual' | 'equipe';
    nome: string;
    meta: string;
    periodo: 'diária' | 'semanal' | 'mensal';
    moedas: number;
    setor?: string;
  };
}

export const MetaConquistada = ({ isVisible, onClose, conquista }: MetaConquistadaProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      
      // Tocar som baseado no período da meta
      playSound(conquista.periodo);
      
      // Remover confetes após 4 segundos
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      // Fechar notificação após 6 segundos
      const closeTimer = setTimeout(() => {
        onClose();
      }, 6000);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isVisible, conquista.periodo, onClose]);

  const playSound = (periodo: string) => {
    try {
      let audio: HTMLAudioElement;
      
      if (periodo === 'diária') {
        // Som de palmas para metas diárias
        audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbUtqpsmdXO8oMUMHCYKSzpNJ1iZVvq4fLlKxwaktuKsTnf3NRZxgxRXnGTF1fXkeKZZZjQNvMiTppqzP');
      } else {
        // Som de fogos para metas semanais/mensais
        audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbUtqpsmdXO8oMUMHCYKSzpNJ1iZVvq4fLlKxwaktuKsTnf3NRZxgxRXnGTF1fXkeKZZZjQNvMiTppqzP');
      }
      
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Erro ao reproduzir som:', e));
    } catch (error) {
      console.log('Som não pôde ser reproduzido:', error);
    }
  };

  const getIcon = () => {
    switch (conquista.periodo) {
      case 'diária': return <Target className="h-6 w-6 text-blue-500" />;
      case 'semanal': return <Star className="h-6 w-6 text-yellow-500" />;
      case 'mensal': return <Trophy className="h-6 w-6 text-gold-500" />;
      default: return <Trophy className="h-6 w-6 text-gold-500" />;
    }
  };

  const getBadgeColor = () => {
    switch (conquista.periodo) {
      case 'diária': return 'bg-blue-100 text-blue-800';
      case 'semanal': return 'bg-yellow-100 text-yellow-800';
      case 'mensal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
        />
      )}
      
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
        <Card className="w-96 mx-4 animate-bounce bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-2xl pointer-events-auto">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              {getIcon()}
            </div>
            
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                🎉 PARABÉNS, {conquista.nome.toUpperCase()}! 🎉
              </div>
              
              <div className="text-lg text-gray-700">
                {conquista.tipo === 'individual' ? 'Você bateu' : 'Vocês bateram'} a meta {conquista.periodo}!
              </div>
              
              <div className="text-md text-gray-600 font-medium">
                📊 {conquista.meta}
              </div>
              
              <Badge className={`${getBadgeColor()} text-sm px-3 py-1`}>
                Meta {conquista.periodo}
              </Badge>
              
              <div className="flex items-center justify-center gap-2 text-lg font-bold text-green-600 bg-green-50 rounded-lg py-2 px-4">
                <Coins className="h-5 w-5" />
                +{conquista.moedas} Moedas Zaynianas foram adicionadas!
              </div>
              
              {conquista.setor && (
                <div className="text-sm text-gray-500">
                  Setor: {conquista.setor}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
