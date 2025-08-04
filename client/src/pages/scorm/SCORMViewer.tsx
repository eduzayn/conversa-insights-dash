import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SCORMViewer() {
  const { contentId } = useParams();
  const navigate = useNavigate();

  // Buscar dados do conteúdo
  const { data: content, isLoading } = useQuery({
    queryKey: ['/api/professor/content', contentId],
    queryFn: async () => {
      const response = await apiRequest(`/api/professor/contents/${contentId}`);
      return response;
    },
    enabled: !!contentId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conteúdo SCORM...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conteúdo não encontrado</p>
          <Button onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Extrair ID do arquivo do Google Drive
  const driveInfo = getGoogleDriveEmbedUrl(content.url || content.conteudo);
  
  if (!driveInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">URL do conteúdo inválida</p>
          <Button onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const scormPlayerUrl = `/api/scorm/player/scorm-${driveInfo.fileId}?driveFileId=${driveInfo.fileId}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header fixo */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h1 className="font-semibold text-gray-900">{content.titulo}</h1>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200">
          SCORM Ativo
        </Badge>
      </div>

      {/* Container do SCORM - Tela Cheia */}
      <div className="flex-1 relative">
        <iframe
          src={scormPlayerUrl}
          className="w-full h-full absolute inset-0"
          style={{ 
            border: "none",
            minHeight: "calc(100vh - 64px)"
          }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allowFullScreen
          title={`Conteúdo SCORM - ${content.titulo}`}
          allow="autoplay; fullscreen; microphone; camera; clipboard-read; clipboard-write; geolocation"
        />
      </div>
    </div>
  );
}

// Função para extrair ID do Google Drive
function getGoogleDriveEmbedUrl(url: string) {
  const filePatterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/,
    /https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9-_]+)/
  ];

  for (const pattern of filePatterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      return {
        fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
      };
    }
  }
  
  return null;
}