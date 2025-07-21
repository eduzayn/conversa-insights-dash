import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  'pendente': 'bg-yellow-100 text-yellow-800',
  'em_andamento': 'bg-blue-100 text-blue-800', 
  'concluido': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
  'em_atraso': 'bg-orange-100 text-orange-800'
};

const STATUS_LABELS = {
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'concluido': 'Concluído', 
  'cancelado': 'Cancelado',
  'em_atraso': 'Em Atraso'
};

function Certificacoes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pos');

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['/api/certifications', { categoria: activeTab, page: 1, limit: 50 }],
    enabled: false // Desabilitado temporariamente para evitar erros
  });

  const certificationsArray = Array.isArray(certifications) ? certifications : [];

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando certificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Análises Certificações</h1>
                <p className="text-gray-600">Gerencie certificações e processos de documentação</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Certificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certificationsArray.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma certificação encontrada
                  </div>
                  <div className="text-gray-600">
                    Sistema temporariamente em manutenção
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificationsArray.slice(0, 10).map((cert: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{cert.aluno || 'Nome não informado'}</h3>
                          <p className="text-sm text-gray-600">{cert.curso || 'Curso não informado'}</p>
                        </div>
                        <Badge className={STATUS_COLORS[cert.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pendente}>
                          {STATUS_LABELS[cert.status as keyof typeof STATUS_LABELS] || 'Pendente'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Certificacoes;