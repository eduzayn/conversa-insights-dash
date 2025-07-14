import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Send, FileText, Plus, Edit, Trash2, AlertTriangle, ArrowLeft, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/Sidebar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EnvioUnicv {
  id?: number;
  certificationId: number;
  aluno: string;
  cpf: string;
  curso: string;
  categoria: string;
  statusEnvio: 'nao_enviado' | 'enviado';
  numeroOficio?: string;
  dataEnvio?: string;
  observacoes?: string;
  colaboradorResponsavel: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Certificacao {
  id: number;
  aluno: string;
  cpf: string;
  curso: string;
  categoria: string;
}

const EnviosUnicv: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState<EnvioUnicv | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxValue, setComboboxValue] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Buscar certificações para popular o select com paginação
  const [certificacoesPage, setCertificacoesPage] = useState(1);
  const [allCertificacoes, setAllCertificacoes] = useState<Certificacao[]>([]);
  const [hasMoreCertificacoes, setHasMoreCertificacoes] = useState(true);

  const { data: certificacoes, isLoading: loadingCertificacoes } = useQuery({
    queryKey: ['/api/certificacoes', { categoria: 'segunda_licenciatura,formacao_pedagogica', page: certificacoesPage, limit: 100 }],
    queryFn: async () => {
      const params = new URLSearchParams({
        categoria: 'segunda_licenciatura,formacao_pedagogica',
        page: certificacoesPage.toString(),
        limit: '100'
      });
      return apiRequest(`/api/certificacoes?${params}`);
    }
  });

  // Atualizar lista de certificações quando novos dados chegam
  useEffect(() => {
    if (certificacoes?.data && Array.isArray(certificacoes.data)) {
      if (certificacoesPage === 1) {
        setAllCertificacoes(certificacoes.data);
      } else {
        setAllCertificacoes(prev => [...prev, ...certificacoes.data]);
      }
      
      // Verificar se há mais páginas
      setHasMoreCertificacoes(
        certificacoes.data.length === 100 && 
        certificacoes.pagination && 
        certificacoes.pagination.page < certificacoes.pagination.totalPages
      );
    } else if (certificacoes?.data && !Array.isArray(certificacoes.data)) {
      // Se os dados não estão no formato esperado, usar como array vazio
      setAllCertificacoes([]);
      setHasMoreCertificacoes(false);
    }
  }, [certificacoes, certificacoesPage]);

  // Função para carregar mais certificações
  const loadMoreCertificacoes = () => {
    if (hasMoreCertificacoes && !loadingCertificacoes) {
      setCertificacoesPage(prev => prev + 1);
    }
  };

  // Buscar colaboradores (usuários admin e agentes)
  const { data: colaboradores = [], isLoading: loadingColaboradores } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });

  // Buscar envios UNICV
  const { data: envios = [], isLoading: loadingEnvios } = useQuery({
    queryKey: ['/api/envios-unicv', { search: searchTerm, status: statusFilter, categoria: categoriaFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (categoriaFilter && categoriaFilter !== 'all') params.append('categoria', categoriaFilter);
      return apiRequest(`/api/envios-unicv?${params}`);
    }
  });

  // Mutation para criar/atualizar envio
  const envioMutation = useMutation({
    mutationFn: async (data: EnvioUnicv) => {
      if (data.id) {
        return apiRequest(`/api/envios-unicv/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/envios-unicv', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      console.log('Invalidando cache após criação/edição...');
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/envios-unicv'
      });
      setIsCreateModalOpen(false);
      setSelectedEnvio(null);
      toast({ title: "Sucesso", description: "Envio UNICV salvo com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao salvar envio UNICV", variant: "destructive" });
    }
  });

  // Mutation para deletar envio
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/envios-unicv/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      console.log('Invalidando cache após exclusão...');
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/envios-unicv'
      });
      toast({ title: "Sucesso", description: "Envio UNICV excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao excluir envio UNICV", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const certificationId = parseInt(formData.get('certificationId') as string);
    const certificacao = allCertificacoes?.find((cert: Certificacao) => cert.id === certificationId);
    
    const data: EnvioUnicv = {
      certificationId,
      aluno: certificacao?.aluno || '',
      cpf: certificacao?.cpf || '',
      curso: certificacao?.curso || '',
      categoria: certificacao?.categoria || '',
      statusEnvio: formData.get('statusEnvio') as 'nao_enviado' | 'enviado',
      numeroOficio: formData.get('numeroOficio') as string || undefined,
      dataEnvio: formData.get('dataEnvio') as string || undefined,
      observacoes: formData.get('observacoes') as string || undefined,
      colaboradorResponsavel: formData.get('colaboradorResponsavel') as string,
      ...(selectedEnvio?.id && { id: selectedEnvio.id })
    };

    envioMutation.mutate(data);
  };

  const openEditModal = (envio: EnvioUnicv) => {
    setSelectedEnvio(envio);
    setComboboxValue(envio.certificationId.toString()); // Definir valor do combobox
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDeleteEnvio = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'enviado': return 'default';
      case 'nao_enviado': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enviado': return 'Enviado';
      case 'nao_enviado': return 'Não Enviado';
      default: return status;
    }
  };

  const categorias = ['pos_graduacao', 'segunda_graduacao', 'formacao_pedagogica', 'formacao_livre', 'eja', 'graduacao', 'diplomacao_competencia', 'capacitacao', 'sequencial'];

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const stats = {
    total: envios.length || 0,
    enviados: envios.filter((envio: EnvioUnicv) => envio.statusEnvio === 'enviado').length || 0,
    naoEnviados: envios.filter((envio: EnvioUnicv) => envio.statusEnvio === 'nao_enviado').length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Envios UNICV</h1>
                <p className="text-gray-600 mt-2">
                  Gerenciamento de envios de dados dos alunos para a UNICV
                </p>
              </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enviados</CardTitle>
                  <Send className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.enviados}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Não Enviados</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.naoEnviados}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros e Busca */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
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
                        <SelectItem key="all-status" value="all">Todos os status</SelectItem>
                        <SelectItem key="enviado" value="enviado">Enviado</SelectItem>
                        <SelectItem key="nao_enviado" value="nao_enviado">Não Enviado</SelectItem>
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
                        <SelectItem key="all-categoria" value="all">Todas as categorias</SelectItem>
                        {categorias.filter(categoria => categoria).map(categoria => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            setSelectedEnvio(null);
                            setComboboxValue(''); // Limpar combobox ao criar novo
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Envio UNICV
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Envios */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Envios UNICV</CardTitle>
                <CardDescription>
                  Todos os envios de dados de alunos para a UNICV
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEnvios ? (
                  <div className="text-center py-8">Carregando envios...</div>
                ) : envios.length === 0 ? (
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
                          <th className="text-left p-4 font-medium">Status do Envio</th>
                          <th className="text-left p-4 font-medium">Nº do Ofício</th>
                          <th className="text-left p-4 font-medium">Data de Envio</th>
                          <th className="text-left p-4 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(envios || []).filter(envio => envio && envio.id).map((envio: EnvioUnicv) => (
                          <tr key={envio.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{envio.aluno}</td>
                            <td className="p-4">{envio.cpf}</td>
                            <td className="p-4 max-w-xs truncate" title={envio.curso}>
                              {envio.curso}
                            </td>
                            <td className="p-4">
                              <span className="capitalize">
                                {envio.categoria.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge variant={getBadgeVariant(envio.statusEnvio)}>
                                {getStatusLabel(envio.statusEnvio)}
                              </Badge>
                            </td>
                            <td className="p-4">{envio.numeroOficio || '-'}</td>
                            <td className="p-4">{formatDate(envio.dataEnvio || '')}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(envio)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(envio.id!)}
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

            {/* Modal de Criação/Edição */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEnvio ? 'Editar Envio UNICV' : 'Novo Envio UNICV'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedEnvio 
                      ? 'Edite as informações do envio UNICV'
                      : 'Preencha as informações para criar um novo envio UNICV'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="certificationId">Aluno (Certificação)</Label>
                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-full justify-between"
                          >
                            {comboboxValue
                              ? (allCertificacoes || []).find((cert) => cert.id.toString() === comboboxValue)
                                ? `${(allCertificacoes || []).find((cert) => cert.id.toString() === comboboxValue)?.aluno} - ${(allCertificacoes || []).find((cert) => cert.id.toString() === comboboxValue)?.cpf}`
                                : "Selecione um aluno..."
                              : "Selecione um aluno..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar aluno por nome, CPF ou curso..." 
                              className="h-9"
                            />
                            <CommandList className="max-h-60">
                              <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                              <CommandGroup>
                                {(allCertificacoes || []).filter(cert => cert && cert.id && cert.aluno && cert.cpf && cert.curso).map((cert: Certificacao) => (
                                  <CommandItem
                                    key={cert.id}
                                    value={`${cert.aluno} ${cert.cpf} ${cert.curso}`}
                                    onSelect={() => {
                                      setComboboxValue(cert.id.toString());
                                      setComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        comboboxValue === cert.id.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{cert.aluno}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {cert.cpf} • {cert.curso}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                                
                                {/* Botão para carregar mais certificações */}
                                {hasMoreCertificacoes && (
                                  <div className="p-2 border-t">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={loadMoreCertificacoes}
                                      disabled={loadingCertificacoes}
                                      className="w-full text-blue-600 hover:text-blue-700"
                                    >
                                      {loadingCertificacoes ? 'Carregando...' : 'Carregar mais alunos...'}
                                    </Button>
                                  </div>
                                )}
                              </CommandGroup>
                              
                              {/* Indicador de total carregado */}
                              <div className="p-2 text-xs text-gray-500 text-center border-t">
                                {(allCertificacoes || []).length} alunos carregados
                                {!hasMoreCertificacoes && (allCertificacoes || []).length > 0 && ' (todos)'}
                              </div>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Campo hidden para o formulário */}
                      <input 
                        type="hidden" 
                        name="certificationId" 
                        value={comboboxValue}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="statusEnvio">Status do Envio</Label>
                      <Select 
                        name="statusEnvio" 
                        defaultValue={selectedEnvio?.statusEnvio || 'nao_enviado'}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="modal-nao_enviado" value="nao_enviado">Não Enviado</SelectItem>
                          <SelectItem key="modal-enviado" value="enviado">Enviado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="colaboradorResponsavel">Colaborador Responsável</Label>
                      <Select 
                        name="colaboradorResponsavel" 
                        defaultValue={selectedEnvio?.colaboradorResponsavel}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(colaboradores || []).filter(colab => colab && colab.id && colab.username).map((colab: any) => (
                            <SelectItem key={colab.id} value={colab.username}>
                              {colab.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="numeroOficio">Número do Ofício</Label>
                      <Input
                        name="numeroOficio"
                        placeholder="Ex: 042/2025"
                        defaultValue={selectedEnvio?.numeroOficio}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dataEnvio">Data de Envio</Label>
                      <Input
                        name="dataEnvio"
                        type="date"
                        defaultValue={selectedEnvio?.dataEnvio || new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        name="observacoes"
                        placeholder="Observações sobre o envio..."
                        defaultValue={selectedEnvio?.observacoes}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={envioMutation.isPending}
                    >
                      {envioMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* AlertDialog para confirmação de exclusão */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Confirmar Exclusão
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza de que deseja excluir este envio UNICV? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteId(null)}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteEnvio}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnviosUnicv;