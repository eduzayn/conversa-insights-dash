
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Smile, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/pages/ChatInterno";
import { useChatContext } from "@/contexts/ChatContext";

interface MessageInputProps {
  chatId: string;
  currentUser: User | null;
}

const WORK_EMOJIS = [
  '👍', '👏', '🎯', '💡', '📈', '✅', '🚀', '💪', 
  '🔥', '⭐', '🙌', '👌', '💯', '🎉', '🏆', '📊'
];

export const MessageInput = ({ chatId, currentUser }: MessageInputProps) => {
  const { addMessage } = useChatContext();
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return;

    addMessage(chatId, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: message.trim(),
      type: 'text'
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Simular upload - em uma implementação real, você faria upload para um servidor
    const fileUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');

    addMessage(chatId, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: `Enviou ${isImage ? 'uma imagem' : 'um arquivo'}`,
      type: isImage ? 'image' : 'file',
      fileUrl,
      fileName: file.name
    });

    // Reset input
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

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
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
    
    addMessage(chatId, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: `Enviou um áudio (${recordingTime}s)`,
      type: 'audio',
      fileUrl: audioUrl
    });

    setAudioBlob(null);
    setRecordingTime(0);
  };

  const cancelAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Se há um áudio gravado, mostrar preview
  if (audioBlob) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Mic className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">Áudio gravado ({formatTime(recordingTime)})</p>
            <audio controls className="w-full mt-2">
              <source src={URL.createObjectURL(audioBlob)} type="audio/mpeg" />
            </audio>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelAudio}>
              Cancelar
            </Button>
            <Button size="sm" onClick={sendAudio} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="grid grid-cols-8 gap-2">
            {WORK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-lg hover:bg-gray-200 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* File Upload */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Audio Recording */}
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`text-gray-500 hover:text-gray-700 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {isRecording && (
            <span className="text-sm text-red-600 font-mono">
              {formatTime(recordingTime)}
            </span>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
