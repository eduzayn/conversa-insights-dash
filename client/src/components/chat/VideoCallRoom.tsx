
import { useEffect, useRef, useState } from "react";
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack 
} from "agora-rtc-sdk-ng";
import { User } from "@/types/chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserX } from "lucide-react";

interface VideoCallRoomProps {
  channelName: string;
  currentUser: User | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onLeaveCall: () => void;
}

// Configuração da Agora.io
const APP_ID = "ce034264cc174eb39021ea97dade65cf";

export const VideoCallRoom = ({
  channelName,
  currentUser,
  isVideoEnabled,
  isAudioEnabled,
  onLeaveCall
}: VideoCallRoomProps) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Inicializar cliente Agora
  useEffect(() => {
    const initAgora = async () => {
      try {
        console.log('Inicializando Agora RTC...');
        
        const agoraClient = AgoraRTC.createClient({ 
          mode: "rtc", 
          codec: "vp8" 
        });

        // Event listeners
        agoraClient.on("user-published", async (user, mediaType) => {
          console.log('Usuário publicou:', user.uid, mediaType);
          await agoraClient.subscribe(user, mediaType);
          
          if (mediaType === "video") {
            const remoteVideoTrack = user.videoTrack;
            const userId = user.uid.toString();
            const videoElement = remoteVideoRefs.current[userId];
            if (remoteVideoTrack && videoElement) {
              remoteVideoTrack.play(videoElement);
            }
          }
          
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }

          setRemoteUsers(prev => {
            const existing = prev.find(u => u.uid === user.uid);
            if (existing) {
              return prev.map(u => u.uid === user.uid ? user : u);
            }
            return [...prev, user];
          });
        });

        agoraClient.on("user-unpublished", (user) => {
          console.log('Usuário saiu:', user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        agoraClient.on("user-left", (user) => {
          console.log('Usuário deixou o canal:', user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        setClient(agoraClient);

        // Gerar token temporário (em produção, isso deve vir do backend)
        const token = await generateAgoraToken(channelName, currentUser?.id || '');
        
        // Entrar no canal
        await agoraClient.join(APP_ID, channelName, token, currentUser?.id);
        console.log('Conectado ao canal:', channelName);

        // Criar e publicar tracks locais
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        // Publicar tracks
        await agoraClient.publish([videoTrack, audioTrack]);
        console.log('Tracks publicados com sucesso');

        setIsConnecting(false);

      } catch (err) {
        console.error('Erro ao inicializar Agora:', err);
        setError('Erro ao conectar com o serviço de vídeo. Tente novamente.');
        setIsConnecting(false);
      }
    };

    if (currentUser && channelName) {
      initAgora();
    }

    return () => {
      // Cleanup
      if (client) {
        client.leave();
        localVideoTrack?.close();
        localAudioTrack?.close();
      }
    };
  }, [channelName, currentUser]);

  // Controlar vídeo local
  useEffect(() => {
    if (localVideoTrack) {
      if (isVideoEnabled) {
        localVideoTrack.setEnabled(true);
        if (localVideoRef.current) {
          localVideoTrack.play(localVideoRef.current);
        }
      } else {
        localVideoTrack.setEnabled(false);
      }
    }
  }, [localVideoTrack, isVideoEnabled]);

  // Controlar áudio local
  useEffect(() => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isAudioEnabled);
    }
  }, [localAudioTrack, isAudioEnabled]);

  // Função temporária para gerar token (em produção, deve vir do backend)
  const generateAgoraToken = async (channelName: string, userId: string): Promise<string> => {
    // Em produção, fazer uma requisição para o backend para obter o token
    console.log('Gerando token para canal:', channelName, 'usuário:', userId);
    
    // Por enquanto, retornamos null (modo de teste sem token)
    // Em produção, implementar chamada para o backend:
    // const response = await fetch('/api/agora/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ channelName, userId })
    // });
    // return response.json().then(data => data.token);
    
    return "";
  };

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription className="text-red-600">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Conectando à chamada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {/* Vídeo local */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        <div 
          ref={localVideoRef}
          className="w-full h-full"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          Você ({currentUser?.name})
        </div>
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                <span className="text-white text-xl font-bold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <p className="text-white text-sm">Câmera desligada</p>
            </div>
          </div>
        )}
      </div>

      {/* Vídeos remotos */}
      {remoteUsers.map(user => (
        <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <div 
            ref={(el) => {
              remoteVideoRefs.current[user.uid.toString()] = el;
            }}
            className="w-full h-full"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            Usuário {user.uid}
          </div>
          {!user.hasVideo && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <UserX className="h-8 w-8 text-white" />
                </div>
                <p className="text-white text-sm">Sem vídeo</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Placeholder para quando não há usuários remotos */}
      {remoteUsers.length === 0 && (
        <div className="col-span-full flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aguardando outros participantes...</p>
            <p className="text-sm mt-2">Canal: {channelName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
