
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const { user, loading } = useAuth();
  const [iframeError, setIframeError] = useState(false);

  // URL do iframe do BotConversa - usando uma URL de exemplo mais realista
  const botconversaIframeUrl = "https://widget.botconversa.com.br/webchat/chatbot/";

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

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleOpenBotConversa = () => {
    window.open("https://app.botconversa.com.br/login/", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Chat ao Vivo</h1>
              </div>
              <p className="text-gray-600">
                Chat em tempo real integrado ao BotConversa
              </p>
            </div>

            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex flex-col gap-3">
                  <p>O chat widget do BotConversa requer configuração específica com seu ID de chatbot.</p>
                  <div className="flex gap-2">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Aguardando Configuração</span>
                </div>
              </div>
              
              <div className="relative h-96 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Widget em Desenvolvimento</h3>
                  <p className="text-gray-600 mb-4">
                    Para integrar o chat do BotConversa, você precisa:
                  </p>
                  <ul className="text-left text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Obter o ID do seu chatbot no BotConversa</li>
                    <li>• Configurar a URL do widget</li>
                    <li>• Definir as permissões necessárias</li>
                  </ul>
                  <Button 
                    onClick={handleOpenBotConversa}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Configurar no BotConversa
                  </Button>
                </div>
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
};

export default Chat;
