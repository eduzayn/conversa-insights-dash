
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, ExternalLink } from 'lucide-react';

interface VoiceCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  jitsiUrl: string;
  chatName: string;
  conversationType: 'geral' | 'equipe' | 'privada';
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  open,
  onOpenChange,
  roomName,
  jitsiUrl,
  chatName,
  conversationType
}) => {
  const handleJoinCall = () => {
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const getCallDescription = () => {
    switch (conversationType) {
      case 'geral':
        return 'Você está prestes a entrar em uma chamada de voz com todos os colaboradores.';
      case 'equipe':
        return `Você está prestes a entrar em uma chamada de voz com a equipe ${chatName}.`;
      case 'privada':
        return `Você está prestes a entrar em uma chamada de voz privada com ${chatName}.`;
      default:
        return 'Você está prestes a entrar em uma chamada de voz.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Pronto para iniciar a chamada de voz?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            {getCallDescription()} Utilizando o ambiente seguro do <strong>Jitsi Meet</strong>.
          </p>

          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              Chamada apenas de áudio (vídeo desativado)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              Sem necessidade de instalar nada
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              Link privado e exclusivo para sua conversa
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              Qualquer membro pode entrar a qualquer momento
            </li>
          </ul>

          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm">
              <strong>🔗 Sala de áudio:</strong>{' '}
              <code className="text-green-600 bg-white px-2 py-1 rounded text-xs">
                {roomName}
              </code>
            </p>
          </div>

          <div className="text-sm text-gray-500">
            💡 <em>Permita o acesso ao microfone do navegador para uma melhor experiência!</em>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleJoinCall}
              className="bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Entrar agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
