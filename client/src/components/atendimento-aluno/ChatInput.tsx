
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Conversation } from "@/types/atendimento-aluno";
import { Send, Paperclip, Smile, MessageCircle, StickyNote, Mic, Square } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
  conversation: Conversation;
  currentUser: any;
  onSendMessage: (conversationId: string, content: string, currentUser: any) => void;
  onSaveInternalNote: (conversationId: string, content: string, currentUser: any) => void;
}

export const ChatInput = ({ 
  conversation, 
  currentUser, 
  onSendMessage, 
  onSaveInternalNote 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"message" | "note">("message");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    
    if (messageType === "message") {
      onSendMessage(conversation.id, message.trim(), currentUser);
    } else {
      onSaveInternalNote(conversation.id, message.trim(), currentUser);
    }
    
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');

    // Simular envio do arquivo como mensagem
    onSendMessage(conversation.id, `Enviou ${isImage ? 'uma imagem' : 'um arquivo'}: ${file.name}`, currentUser);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      // Erro ao iniciar gravação
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const sendAudio = () => {
    if (!audioBlob || !currentUser) return;

    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Enviar áudio como mensagem
    onSendMessage(conversation.id, `Enviou um áudio (${formatTime(recordingTime)})`, currentUser);

    setAudioBlob(null);
    setRecordingTime(0);
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (conversation.status === 'finalizado') {
    return (
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-center text-gray-600">
          Esta conversa foi finalizada. Para reabrir, altere o status acima.
        </p>
      </div>
    );
  }

  // Se há um áudio gravado, mostrar preview
  if (audioBlob) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <Mic className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 mb-2">Áudio gravado ({formatTime(recordingTime)})</p>
            <audio controls className="w-full">
              <source src={URL.createObjectURL(audioBlob)} type="audio/mpeg" />
              Seu navegador não suporta áudio.
            </audio>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelAudio}>
              Cancelar
            </Button>
            <Button size="sm" onClick={sendAudio} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-1" />
              Enviar Áudio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      {/* Toggle de Seleção do Tipo */}
      <div className="mb-3">
        <ToggleGroup
          type="single"
          value={messageType}
          onValueChange={(value) => value && setMessageType(value as "message" | "note")}
          className="justify-start"
        >
          <ToggleGroupItem 
            value="message" 
            className={`flex items-center gap-2 ${
              messageType === "message" 
                ? "bg-blue-100 text-blue-700 border-blue-300" 
                : "bg-gray-50 text-gray-600"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Mensagem para o Aluno
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="note"
            className={`flex items-center gap-2 ${
              messageType === "note" 
                ? "bg-yellow-100 text-yellow-700 border-yellow-300" 
                : "bg-gray-50 text-gray-600"
            }`}
          >
            <StickyNote className="h-4 w-4" />
            Nota Interna
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Indicador do tipo selecionado */}
        <p className="text-xs text-gray-500 mt-1">
          {messageType === "message" 
            ? "Este conteúdo será enviado como mensagem para o aluno" 
            : "Este conteúdo será salvo como nota interna (visível apenas para atendentes)"
          }
        </p>
      </div>

      {/* Campo de Digitação Único */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              messageType === "message" 
                ? "Digite sua mensagem para o aluno..." 
                : "Digite sua nota interna..."
            }
            className="min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              
              {/* Botão de Gravação de Áudio */}
              <Button
                variant="ghost"
                size="sm"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className={`${isRecording ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                title={isRecording ? "Solte para parar a gravação" : "Pressione e segure para gravar áudio"}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {isRecording && (
                <span className="text-sm text-red-600 font-mono">
                  {formatTime(recordingTime)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleSend}
          disabled={!message.trim()}
          className="self-end"
          variant={messageType === "note" ? "secondary" : "default"}
        >
          {messageType === "message" ? (
            <>
              <Send className="h-4 w-4" />
              Enviar
            </>
          ) : (
            <>
              <StickyNote className="h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
