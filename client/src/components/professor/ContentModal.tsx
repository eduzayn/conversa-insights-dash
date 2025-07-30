import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, BookOpen, Link as LinkIcon, FileText, Eye, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { SubjectContent, Subject } from "@/types/professor";

interface ContentModalProps {
  content: SubjectContent;
  subject?: Subject;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContentModal({ content, subject, isOpen, onClose }: ContentModalProps) {
  const [viewCount, setViewCount] = useState(content.visualizacoes || 0);
  const queryClient = useQueryClient();

  const incrementViewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/professor/contents/${content.id}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Erro ao registrar visualização');
      return response.json();
    },
    onSuccess: () => {
      setViewCount((prev: number) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['professor', 'contents'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-600" />;
      case 'ebook': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-green-600" />;
      case 'pdf': return <FileText className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Vídeo-aula';
      case 'ebook': return 'E-book';
      case 'link': return 'Link Útil';
      case 'pdf': return 'PDF';
      default: return 'Conteúdo';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-700 border-red-200';
      case 'ebook': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'link': return 'bg-green-100 text-green-700 border-green-200';
      case 'pdf': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleOpenContent = () => {
    incrementViewMutation.mutate();
    window.open(content.conteudo, '_blank');
  };

  const isYouTubeVideo = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

  const renderContentPreview = () => {
    if (content.tipo === 'video' && isYouTubeVideo(content.conteudo)) {
      const embedUrl = getYouTubeEmbedUrl(content.conteudo);
      if (embedUrl) {
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <iframe
              src={embedUrl}
              title={content.titulo}
              className="w-full h-full"
              allowFullScreen
              onLoad={() => incrementViewMutation.mutate()}
            />
          </div>
        );
      }
    }

    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              {getTypeIcon(content.tipo)}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Preview não disponível</h4>
              <p className="text-sm text-gray-600 mt-1">
                Clique no botão abaixo para abrir o conteúdo em uma nova aba
              </p>
            </div>
            <Button onClick={handleOpenContent} className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Conteúdo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(content.tipo)}
              <div>
                <DialogTitle className="text-xl">{content.titulo}</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {subject?.nome || 'Disciplina não encontrada'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges e informações */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={getTypeColor(content.tipo)}>
              {getTypeName(content.tipo)}
            </Badge>
            
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{viewCount} visualizações</span>
            </div>
            
            {content.createdAt && (
              <div className="text-sm text-gray-500">
                Criado em {formatDate(content.createdAt)}
              </div>
            )}
          </div>

          {/* Descrição */}
          {content.descricao && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
              <p className="text-gray-700 leading-relaxed">{content.descricao}</p>
            </div>
          )}

          {/* URL do conteúdo */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">URL do Conteúdo</h4>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm text-gray-700 break-all">
                {content.conteudo}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(content.conteudo)}
              >
                Copiar
              </Button>
            </div>
          </div>

          {/* Preview do conteúdo */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
            {renderContentPreview()}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button onClick={handleOpenContent} className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em Nova Aba
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}