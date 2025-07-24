import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceTranscriptionProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export const VoiceTranscription: React.FC<VoiceTranscriptionProps> = ({
  onTranscript,
  isDisabled = false,
  className = ""
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se a Web Speech API é suportada
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      // Configurar o reconhecimento de voz
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      
      let finalTranscript = '';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Enviar transcrição final quando disponível
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
          finalTranscript = '';
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Permissão negada",
            description: "Por favor, permita o acesso ao microfone para usar a transcrição de voz.",
            variant: "destructive"
          });
        } else if (event.error === 'no-speech') {
          toast({
            title: "Nenhuma fala detectada",
            description: "Tente falar mais próximo ao microfone.",
            variant: "default"
          });
        } else {
          toast({
            title: "Erro na transcrição",
            description: "Ocorreu um erro durante a transcrição de voz. Tente novamente.",
            variant: "destructive"
          });
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API não suportada neste navegador');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, toast]);

  const startListening = () => {
    if (!recognitionRef.current || isDisabled) return;
    
    try {
      setIsListening(true);
      recognitionRef.current.start();
      
      toast({
        title: "Gravação iniciada",
        description: "Fale agora. Sua voz será transcrita automaticamente.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
      setIsListening(false);
      toast({
        title: "Erro ao iniciar gravação",
        description: "Não foi possível iniciar a transcrição de voz.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
    
    toast({
      title: "Gravação finalizada",
      description: "Transcrição de voz encerrada.",
      variant: "default"
    });
  };

  if (!isSupported) {
    return null; // Não renderizar se não for suportado
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={isListening ? stopListening : startListening}
      disabled={isDisabled}
      className={`flex items-center gap-2 ${isListening 
        ? 'border-red-500 bg-red-50 hover:bg-red-100' 
        : 'border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700'
      } ${className}`}
      title={isListening ? "Parar gravação" : "Iniciar transcrição de voz"}
    >
      {isListening ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span className="text-red-600 font-medium">Gravando...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700 font-medium">Ditar
</span>
        </>
      )}
    </Button>
  );
};