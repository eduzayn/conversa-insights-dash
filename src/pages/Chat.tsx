
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

const Chat = () => {
  const { user, loading } = useAuth();
  const [iframeError, setIframeError] = useState(false);

  // URL do iframe do BotConversa - pode ser configurada via variável de ambiente
  const botconversaIframeUrl = process.env.REACT_APP_BOTCONVERSA_CHAT_URL || 
    "https://chat.botconversa.com.br/widget?id=DEMO_CHAT";

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

            {iframeError ? (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Não foi possível carregar o chat ao vivo. Verifique sua conexão ou fale com o suporte.
                  <br />
                  <button 
                    onClick={() => setIframeError(false)}
                    className="mt-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Tentar novamente
                  </button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Chat Online</span>
                  </div>
                </div>
                
                <div className="relative">
                  <iframe
                    src={botconversaIframeUrl}
                    width="100%"
                    height="600"
                    style={{ border: 'none' }}
                    allow="microphone; camera"
                    title="Chat ao Vivo BotConversa"
                    onError={handleIframeError}
                    className="w-full"
                  />
                </div>
              </div>
            )}

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
