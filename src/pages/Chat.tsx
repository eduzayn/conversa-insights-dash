
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, AlertTriangle, ExternalLink, Headphones, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Chat = () => {
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState<'comercial' | 'suporte' | null>(null);
  const [iframeError, setIframeError] = useState(false);

  // IDs dos chatbots do BotConversa
  const chatbots = {
    comercial: {
      id: "182301",
      name: "Chat Comercial",
      description: "Vendas e informações comerciais",
      icon: ShoppingCart,
      url: `https://widget.botconversa.com.br/webchat/chatbot/${182301}/`
    },
    suporte: {
      id: "182331", 
      name: "Chat Suporte",
      description: "Suporte técnico e atendimento",
      icon: Headphones,
      url: `https://widget.botconversa.com.br/webchat/chatbot/${182331}/`
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleChatSelection = (chatType: 'comercial' | 'suporte') => {
    setSelectedChat(chatType);
    setIframeError(false);
  };

  const handleBackToSelection = () => {
    setSelectedChat(null);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleOpenBotConversa = () => {
    window.open("https://app.botconversa.com.br/login/", "_blank");
  };

  // Se um chat foi selecionado, mostrar o iframe
  if (selectedChat) {
    const chat = chatbots[selectedChat];
    
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-full mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <chat.icon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{chat.name}</h1>
                    <p className="text-gray-600">{chat.description}</p>
                  </div>
                </div>
                <Button onClick={handleBackToSelection} variant="outline">
                  Voltar à Seleção
                </Button>
              </div>

              {iframeError && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex flex-col gap-3">
                      <p>Não foi possível carregar o chat. Verifique sua conexão ou tente novamente.</p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {setIframeError(false); window.location.reload()}}
                          variant="outline"
                          size="sm"
                        >
                          Tentar Novamente
                        </Button>
                        <Button 
                          onClick={handleOpenBotConversa}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Acessar BotConversa
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {chat.name} - ID: {chat.id}
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <iframe
                    src={chat.url}
                    width="100%"
                    height="600"
                    style={{ border: 'none' }}
                    allow="microphone; camera"
                    onError={handleIframeError}
                    title={`${chat.name} Widget`}
                  />
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Powered by{" "}
                  <a 
                    href="https://botconversa.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    BotConversa
                  </a>
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Tela de seleção de chat
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Chat ao Vivo</h1>
              </div>
              <p className="text-gray-600">
                Escolha o tipo de atendimento que você precisa
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {Object.entries(chatbots).map(([key, chat]) => (
                <Card key={key} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <chat.icon className="h-6 w-6 text-blue-600" />
                      {chat.name}
                    </CardTitle>
                    <CardDescription>{chat.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleChatSelection(key as 'comercial' | 'suporte')}
                      className="w-full"
                    >
                      Iniciar {chat.name}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ID: {chat.id}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex flex-col gap-3">
                  <p>Os chats estão configurados com os IDs do BotConversa. Caso tenha problemas, verifique as configurações no painel.</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleOpenBotConversa}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar Painel BotConversa
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
