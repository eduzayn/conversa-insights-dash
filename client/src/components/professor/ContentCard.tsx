import { Video, BookOpen, Link as LinkIcon, FileText, Eye, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubjectContent } from "@/../shared/schema";

interface Subject {
  id: number;
  nome: string;
  codigo: string;
}

interface ContentCardProps {
  content: SubjectContent;
  subject?: Subject;
  onView: (content: SubjectContent) => void;
  onEdit: (content: SubjectContent) => void;
  onDelete: (id: number) => void;
}

export default function ContentCard({ content, subject, onView, onEdit, onDelete }: ContentCardProps) {
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
      case 'link': return 'Link';
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Cabeçalho com ícone e título */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon(content.tipo)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {truncateText(content.titulo, 60)}
              </h3>
            </div>
          </div>

          {/* Informações da disciplina e tipo */}
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-gray-500">Disciplina:</span>
              <p className="text-sm text-gray-900">{subject?.nome || 'Disciplina não encontrada'}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`text-xs ${getTypeColor(content.tipo)}`}>
                {getTypeName(content.tipo)}
              </Badge>
              
              {content.visualizacoes !== undefined && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye className="w-3 h-3" />
                  <span>{content.visualizacoes} views</span>
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          {content.descricao && (
            <div>
              <span className="text-xs font-medium text-gray-500">Descrição:</span>
              <p className="text-sm text-gray-700 leading-relaxed">
                {truncateText(content.descricao, 100)}
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(content)}
              className="flex-1 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Ver
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(content)}
              className="flex-1 text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(content.id)}
              className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}