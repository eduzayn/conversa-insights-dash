import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, Send, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface EnvioFamar {
  id: number;
  certificationId: number;
  aluno: string;
  cpf: string;
  curso: string;
  categoria: string;
  statusEnvio: 'enviado' | 'nao_enviado' | 'pendente';
  numeroOficio?: string;
  dataEnvio?: string;
  observacoes?: string;
  colaboradorResponsavel?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEnvioFamar {
  certificationId: number;
  statusEnvio: 'enviado' | 'nao_enviado' | 'pendente';
  numeroOficio?: string;
  dataEnvio?: string;
  observacoes?: string;
  colaboradorResponsavel?: string;
}

const STATUS_COLORS = {
  'enviado': 'bg-green-100 text-green-800',
  'nao_enviado': 'bg-red-100 text-red-800',
  'pendente': 'bg-yellow-100 text-yellow-800'
};

const STATUS_LABELS = {
  'enviado': 'Enviado',
  'nao_enviado': 'Não Enviado',
  'pendente': 'Pendente'
};

export default function EnviosFamar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState<EnvioFamar | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Query para buscar envios
  const { data: envios = [], isLoading: loadingEnvios } = useQuery({
    queryKey: ['/api/envios-famar', { search: searchTerm, status: statusFilter, categoria: categoriaFilter }],
    queryFn: () => apiRequest('/api/envios-famar', {
      params: {
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoriaFilter && { categoria: categoriaFilter })
      }
    })
  });

  // Query para buscar certificações (para o dropdown)
  const { data: certificacoes = [] } = useQuery({
    queryKey: ['/api/certificacoes'],
    queryFn: () => apiRequest('/api/certificacoes')
  });

  // Mutation para criar envio
  const createMutation = useMutation({
    mutationFn: (data: CreateEnvioFamar) => apiRequest('/api/envios-famar', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/envios-famar'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Envio FAMAR criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar envio",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar envio
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEnvioFamar> }) =>
      apiRequest(`/api/envios-famar/${id}`, {
        method: 'PUT',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/envios-famar'] });
      setIsEditDialogOpen(false);
      setSelectedEnvio(null);
      toast({
        title: "Sucesso",
        description: "Envio FAMAR atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar envio",
        variant: "destructive"
      });
    }
  });

  // Mutation para excluir envio
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/envios-famar/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/envios-famar'] });
      toast({
        title: "Sucesso",
        description: "Envio FAMAR excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir envio",
        variant: "destructive"
      });
    }
  });

  // Filtrar envios
  const filteredEnvios = envios.filter((envio: EnvioFamar) => {
    const matchesSearch = !searchTerm || 
      envio.aluno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.curso?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || envio.statusEnvio === statusFilter;
    const matchesCategoria = !categoriaFilter || envio.categoria === categoriaFilter;
    
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  // Estatísticas
  const stats = {
    total: filteredEnvios.length,
    enviados: filteredEnvios.filter((e: EnvioFamar) => e.statusEnvio === 'enviado').length,
    naoEnviados: filteredEnvios.filter((e: EnvioFamar) => e.statusEnvio === 'nao_enviado').length,
    pendentes: filteredEnvios.filter((e: EnvioFamar) => e.statusEnvio === 'pendente').length
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      certificationId: parseInt(formData.get('certificationId') as string),
      statusEnvio: formData.get('statusEnvio') as 'enviado' | 'nao_enviado' | 'pendente',
      numeroOficio: formData.get('numeroOficio') as string || undefined,
      dataEnvio: formData.get('dataEnvio') as string || undefined,
      observacoes: formData.get('observacoes') as string || undefined,
      colaboradorResponsavel: formData.get('colaboradorResponsavel') as string || undefined
    };

    if (selectedEnvio) {
      updateMutation.mutate({ id: selectedEnvio.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [selectedEnvio, createMutation, updateMutation]);

  const handleEdit = (envio: EnvioFamar) => {
    setSelectedEnvio(envio);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este envio?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Envios FAMAR</h1>
            <p className="text-gray-600">Gerenciamento de envios de dados dos alunos para a FAMAR</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Envio FAMAR
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.enviados}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Enviados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.naoEnviados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nome, CPF ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status do Envio</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="nao_enviado">Não Enviado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="graduacao">Graduação</SelectItem>
                    <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                    <SelectItem value="eja">EJA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCategoriaFilter('');
                }}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Envios */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Envios FAMAR</CardTitle>
            <CardDescription>
              Todos os envios de dados de alunos para a FAMAR
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEnvios ? (
              <div className="text-center py-8">Carregando envios...</div>
            ) : filteredEnvios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum envio encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Aluno</th>
                      <th className="text-left p-4 font-medium">CPF</th>
                      <th className="text-left p-4 font-medium">Curso</th>
                      <th className="text-left p-4 font-medium">Categoria</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Nº do Ofício</th>
                      <th className="text-left p-4 font-medium">Data de Envio</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvios.map((envio: EnvioFamar) => (
                      <tr key={envio.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{envio.aluno}</td>
                        <td className="p-4">{envio.cpf}</td>
                        <td className="p-4 max-w-xs truncate" title={envio.curso}>
                          {envio.curso}
                        </td>
                        <td className="p-4">
                          <span className="capitalize">
                            {envio.categoria?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[envio.statusEnvio]}>
                            {STATUS_LABELS[envio.statusEnvio]}
                          </Badge>
                        </td>
                        <td className="p-4">{envio.numeroOficio || '-'}</td>
                        <td className="p-4">
                          {envio.dataEnvio ? new Date(envio.dataEnvio).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(envio)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(envio.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para criar/editar envio */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedEnvio(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEnvio ? 'Editar Envio FAMAR' : 'Novo Envio FAMAR'}
              </DialogTitle>
              <DialogDescription>
                {selectedEnvio 
                  ? 'Edite as informações do envio FAMAR'
                  : 'Preencha as informações para criar um novo envio FAMAR'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="certificationId">Certificação</Label>
                  <Select name="certificationId" defaultValue={selectedEnvio?.certificationId?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma certificação" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificacoes.data?.map((cert: any) => (
                        <SelectItem key={cert.id} value={cert.id.toString()}>
                          {cert.aluno} - {cert.curso}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="statusEnvio">Status do Envio</Label>
                  <Select name="statusEnvio" defaultValue={selectedEnvio?.statusEnvio || 'pendente'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="nao_enviado">Não Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numeroOficio">Número do Ofício</Label>
                  <Input
                    id="numeroOficio"
                    name="numeroOficio"
                    placeholder="Ex: OF-001/2024"
                    defaultValue={selectedEnvio?.numeroOficio || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="dataEnvio">Data de Envio</Label>
                  <Input
                    id="dataEnvio"
                    name="dataEnvio"
                    type="date"
                    defaultValue={selectedEnvio?.dataEnvio ? selectedEnvio.dataEnvio.split('T')[0] : ''}
                  />
                </div>

                <div>
                  <Label htmlFor="colaboradorResponsavel">Colaborador Responsável</Label>
                  <Input
                    id="colaboradorResponsavel"
                    name="colaboradorResponsavel"
                    placeholder="Nome do responsável"
                    defaultValue={selectedEnvio?.colaboradorResponsavel || ''}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    name="observacoes"
                    placeholder="Observações sobre o envio..."
                    defaultValue={selectedEnvio?.observacoes || ''}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setSelectedEnvio(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}