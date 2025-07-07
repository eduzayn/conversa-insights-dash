import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Coins, X } from "lucide-react";

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
  const [shouldBounce, setShouldBounce] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  useEffect(() => {
    if (isVisible && !isClosed) {
      setShowConfetti(true);
      setShouldBounce(true);
      
      // Tocar som baseado no período da meta
      playSound(conquista.periodo);
      
      // Parar a animação de bounce após exatamente 3 pulos (1 segundo)
      const bounceTimer = setTimeout(() => {
        setShouldBounce(false);
      }, 1000);
      
      // Remover confetes após 4 segundos
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      // Fechar notificação após 10 segundos se não foi fechada manualmente
      const closeTimer = setTimeout(() => {
        if (!isClosed) {
          handleClose();
        }
      }, 10000);

      return () => {
        clearTimeout(bounceTimer);
        clearTimeout(confettiTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isVisible, conquista.periodo, isClosed]);

  const handleClose = () => {
    setIsClosed(true);
    setShowConfetti(false);
    setShouldBounce(false);
    onClose();
  };

  const playSound = (periodo: string) => {
    try {
      // Criar contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Tocar gritos de comemoração e palmas em paralelo
      playCelebrationSounds(audioContext);
      
      if (periodo === 'diária') {
        // Som de palmas para metas diárias (5 segundos)
        playClapSound(audioContext);
      } else {
        // Som de fogos para metas semanais/mensais (5 segundos)
        playFireworksSound(audioContext);
      }
    } catch (error) {
      console.log('Som não pôde ser reproduzido:', error);
      // Fallback com beep simples
      playBeepSound();
    }
  };

  const playCelebrationSounds = (audioContext: AudioContext) => {
    // Gritos de comemoração (durante os primeiros 4 segundos - tempo dos confetes)
    const celebrationDuration = 4000; // 4 segundos
    const numCheers = 8; // 8 gritos distribuídos
    
    for (let i = 0; i < numCheers; i++) {
      setTimeout(() => {
        // Criar som de grito usando osciladores
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.type = 'sawtooth';
        oscillator2.type = 'triangle';
        
        // Frequências que simulam gritos de alegria
        const baseFreq = 200 + (i * 50);
        oscillator1.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + 0.3);
        
        oscillator2.frequency.setValueAtTime(baseFreq * 1.2, audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(audioContext.currentTime + 0.3);
        oscillator2.stop(audioContext.currentTime + 0.3);
        
      }, (i * celebrationDuration) / numCheers);
    }
    
    // Palmas de fundo (durante os 4 segundos)
    const numBackgroundClaps = 20;
    for (let i = 0; i < numBackgroundClaps; i++) {
      setTimeout(() => {
        const bufferSize = audioContext.sampleRate * 0.1;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Gerar ruído branco para palmas
        for (let j = 0; j < bufferSize; j++) {
          output[j] = Math.random() * 2 - 1;
        }
        
        // Aplicar envelope
        for (let j = 0; j < bufferSize; j++) {
          const envelope = Math.exp(-j / (bufferSize * 0.2));
          output[j] *= envelope;
        }
        
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);
        
        source.buffer = buffer;
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // Volume baixo para fundo
        
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start();
      }, (i * celebrationDuration) / numBackgroundClaps);
    }
  };

  const playClapSound = (audioContext: AudioContext) => {
    // Criar som de palmas usando ruído branco filtrado (5 segundos)
    const duration = 0.15;
    const numClaps = 15; // Aumentado para durar 5 segundos
    const interval = 333; // Intervalo entre palmas (333ms)
    
    for (let i = 0; i < numClaps; i++) {
      setTimeout(() => {
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Gerar ruído branco
        for (let j = 0; j < bufferSize; j++) {
          output[j] = Math.random() * 2 - 1;
        }
        
        // Aplicar envelope para simular palma
        for (let j = 0; j < bufferSize; j++) {
          const envelope = Math.exp(-j / (bufferSize * 0.1));
          output[j] *= envelope;
        }
        
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        
        source.buffer = buffer;
        // Diminuir volume gradualmente
        const volume = Math.max(0.1, 0.3 - (i * 0.015));
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start();
      }, i * interval);
    }
  };

  const playFireworksSound = (audioContext: AudioContext) => {
    // Criar som de fogos com múltiplas frequências (5 segundos)
    const numFireworks = 4; // 4 fogos em 5 segundos
    
    for (let f = 0; f < numFireworks; f++) {
      setTimeout(() => {
        // Som inicial (lançamento)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.7);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.7);
        
        // Explosão (após 0.8 segundos)
        setTimeout(() => {
          const bufferSize = audioContext.sampleRate * 1.0;
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = buffer.getChannelData(0);
          
          // Gerar ruído para explosão
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
          }
          
          const source = audioContext.createBufferSource();
          const explosionGain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();
          
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2000 + (f * 300), audioContext.currentTime);
          filter.Q.setValueAtTime(0.5, audioContext.currentTime);
          
          source.buffer = buffer;
          explosionGain.gain.setValueAtTime(0.3, audioContext.currentTime);
          
          source.connect(filter);
          filter.connect(explosionGain);
          explosionGain.connect(audioContext.destination);
          
          source.start();
        }, 800);
        
      }, f * 1200); // Espaçar fogos a cada 1.2 segundos
    }
  };

  const playBeepSound = () => {
    // Fallback simples usando frequências (5 segundos)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800 + (i * 50), audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        }, i * 500);
      }
    } catch (error) {
      console.log('Não foi possível reproduzir som:', error);
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

  if (!isVisible || isClosed) return null;

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
        <Card className={`relative w-96 mx-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-2xl pointer-events-auto transition-all duration-300 ${
          shouldBounce ? 'animate-bounce' : ''
        }`}>
          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-1 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          </button>

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
