
import { Message, User } from "@/pages/ChatInterno";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FileText, Image, Mic, Download } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
}

export const MessageList = ({ messages, currentUser }: MessageListProps) => {
  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'text':
        return <p className="text-gray-900">{message.content}</p>;
      
      case 'image':
        return (
          <div className="space-y-2">
            {message.content && <p className="text-gray-900">{message.content}</p>}
            <img 
              src={message.fileUrl} 
              alt={message.fileName}
              className="max-w-sm rounded-lg shadow-sm"
            />
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            {message.content && <p className="text-gray-900">{message.content}</p>}
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-w-sm">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.fileName}
                </p>
                <p className="text-xs text-gray-500">Documento</p>
              </div>
              <Download className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="space-y-2">
            {message.content && <p className="text-gray-900">{message.content}</p>}
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-w-sm">
              <Mic className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <audio controls className="w-full">
                  <source src={message.fileUrl} type="audio/mpeg" />
                  Seu navegador não suporta áudio.
                </audio>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p className="text-gray-900">{message.content}</p>;
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500">Nenhuma mensagem ainda.</p>
          <p className="text-sm text-gray-400 mt-1">Seja o primeiro a enviar uma mensagem!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUser?.id;
        const showSender = index === 0 || messages[index - 1].senderId !== message.senderId;
        const showTime = index === 0 || 
          new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutos

        return (
          <div key={message.id} className="space-y-1">
            {showTime && (
              <div className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {formatMessageTime(message.timestamp)}
                </span>
              </div>
            )}
            
            <div className={cn(
              "flex gap-3",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {!isOwn && showSender && (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {message.senderName.charAt(0)}
                </div>
              )}
              
              {!isOwn && !showSender && (
                <div className="w-8 h-8 flex-shrink-0" />
              )}

              <div className={cn(
                "max-w-lg",
                isOwn ? "order-first" : ""
              )}>
                {!isOwn && showSender && (
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {message.senderName}
                  </p>
                )}
                
                <div className={cn(
                  "rounded-lg px-4 py-2",
                  isOwn 
                    ? "bg-blue-600 text-white" 
                    : "bg-white border border-gray-200"
                )}>
                  {renderMessageContent(message)}
                  
                  {message.edited && (
                    <p className={cn(
                      "text-xs mt-1",
                      isOwn ? "text-blue-100" : "text-gray-400"
                    )}>
                      editado
                    </p>
                  )}
                </div>
                
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      <span 
                        key={emoji}
                        className="text-xs bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1"
                      >
                        {emoji} {users.length}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isOwn && showSender && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {message.senderName.charAt(0)}
                </div>
              )}
              
              {isOwn && !showSender && (
                <div className="w-8 h-8 flex-shrink-0" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
