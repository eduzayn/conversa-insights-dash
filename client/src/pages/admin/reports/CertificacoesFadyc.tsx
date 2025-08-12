import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Eye, Edit, Trash2, FileText, Calendar, User, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCertificacaoFadycSchema } from "@shared/schema";
import { toast } from "sonner";
import { CourseSelectField } from "@/components/fadyc/CourseSelectField";
// Função para formatar CPF
const formatCPF = (cpf: string) => {
  if (!cpf) return '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export default function CertificacoesFadyc() {
  const [activeTab, setActiveTab] = useState("pos_graduacao");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCertificacao, setSelectedCertificacao] = useState<any>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar certificações
  const { data: certificacoes = [], isLoading } = useQuery({
    queryKey: ['/api/certificacoes-fadyc', activeTab, searchTerm, statusFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('categoria', activeTab);
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        
        const response = await apiRequest(`/api/certificacoes-fadyc?${params}`);
        if (Array.isArray(response)) {
          return response;
        }
        console.warn('Resposta da API de certificações FADYC não é um array:', response);
        return [];
      } catch (error) {
        console.error('Erro ao buscar certificações FADYC:', error);
        return [];
      }
    }
  });

  // Form para criar/editar certificação
  const form = useForm({
    resolver: zodResolver(insertCertificacaoFadycSchema),
    defaultValues: {
      aluno: "",
      cpf: "",
      curso: "",
      categoria: activeTab,
      statusProcesso: "pendente",
      dataInicio: "",
      dataPrevisaoEntrega: "",
      dataConclusao: "",
      numeroProcesso: "",
      documentosRecebidos: [],
      observacoes: "",
      colaboradorResponsavel: ""
    }
  });

  // Reset form quando muda a aba
  useEffect(() => {
    form.setValue('categoria', activeTab);
  }, [activeTab, form]);

  // Mutation para criar certificação
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/certificacoes-fadyc', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes-fadyc'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast.success("Certificação criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar certificação");
      console.error(error);
    }
  });

  // Mutation para editar certificação
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/certificacoes-fadyc/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes-fadyc'] });
      setIsEditDialogOpen(false);
      setSelectedCertificacao(null);
      form.reset();
      toast.success("Certificação atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar certificação");
      console.error(error);
    }
  });

  // Mutation para deletar certificação
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/certificacoes-fadyc/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes-fadyc'] });
      toast.success("Certificação deletada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar certificação");
      console.error(error);
    }
  });

  const onSubmit = (data: any) => {
    if (selectedCertificacao) {
      updateMutation.mutate({ id: selectedCertificacao.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (certificacao: any) => {
    setSelectedCertificacao(certificacao);
    form.reset({
      aluno: certificacao.aluno,
      cpf: certificacao.cpf,
      curso: certificacao.curso,
      categoria: certificacao.categoria,
      statusProcesso: certificacao.statusProcesso,
      dataInicio: certificacao.dataInicio || "",
      dataPrevisaoEntrega: certificacao.dataPrevisaoEntrega || "",
      dataConclusao: certificacao.dataConclusao || "",
      numeroProcesso: certificacao.numeroProcesso || "",
      documentosRecebidos: Array.isArray(certificacao.documentosRecebidos) ? certificacao.documentosRecebidos : [],
      observacoes: certificacao.observacoes || "",
      colaboradorResponsavel: certificacao.colaboradorResponsavel
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta certificação?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { label: 'Pendente', variant: 'secondary' },
      'em_andamento': { label: 'Em Andamento', variant: 'default' },
      'concluido': { label: 'Concluído', variant: 'success' },
      'cancelado': { label: 'Cancelado', variant: 'destructive' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pendente'];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getCategoriaLabel = (categoria: string) => {
    return categoria === 'pos_graduacao' ? 'Pós-Graduações' : 'Música';
  };

  const safeCertificacoes = Array.isArray(certificacoes) ? certificacoes : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Certificações FADYC</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nova Certificação
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pos_graduacao">Pós-Graduações</TabsTrigger>
          <TabsTrigger value="musica">Música</TabsTrigger>
        </TabsList>

        <TabsContent value="pos_graduacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Certificações de Pós-Graduação
              </CardTitle>
              <CardDescription>
                Gerencie as certificações de cursos de pós-graduação da FADYC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por aluno, CPF ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Previsão Entrega</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                      </TableRow>
                    ) : safeCertificacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Nenhuma certificação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      safeCertificacoes.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.aluno}</TableCell>
                          <TableCell>{formatCPF(cert.cpf)}</TableCell>
                          <TableCell>{cert.curso}</TableCell>
                          <TableCell>{getStatusBadge(cert.statusProcesso)}</TableCell>
                          <TableCell>
                            {cert.dataInicio ? new Date(cert.dataInicio).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            {cert.dataPrevisaoEntrega ? new Date(cert.dataPrevisaoEntrega).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>{cert.colaboradorResponsavel}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(cert)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(cert.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="musica" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Certificações de Música
              </CardTitle>
              <CardDescription>
                Gerencie as certificações de cursos de música da FADYC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por aluno, CPF ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Previsão Entrega</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                      </TableRow>
                    ) : safeCertificacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Nenhuma certificação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      safeCertificacoes.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.aluno}</TableCell>
                          <TableCell>{formatCPF(cert.cpf)}</TableCell>
                          <TableCell>{cert.curso}</TableCell>
                          <TableCell>{getStatusBadge(cert.statusProcesso)}</TableCell>
                          <TableCell>
                            {cert.dataInicio ? new Date(cert.dataInicio).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            {cert.dataPrevisaoEntrega ? new Date(cert.dataPrevisaoEntrega).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>{cert.colaboradorResponsavel}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(cert)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(cert.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar certificação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Certificação {getCategoriaLabel(activeTab)}</DialogTitle>
            <DialogDescription>
              Adicione uma nova certificação de {getCategoriaLabel(activeTab).toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="aluno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Aluno</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="curso"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CourseSelectField
                        value={field.value}
                        onChange={field.onChange}
                        categoria={activeTab as 'pos_graduacao' | 'musica'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="statusProcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Processo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="colaboradorResponsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colaborador Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataPrevisaoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previsão de Entrega</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroProcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Processo</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do processo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a certificação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                  {createMutation.isPending ? "Criando..." : "Criar Certificação"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar certificação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Certificação</DialogTitle>
            <DialogDescription>
              Atualize as informações da certificação
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="aluno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Aluno</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="curso"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CourseSelectField
                        value={field.value}
                        onChange={field.onChange}
                        categoria={selectedCertificacao?.categoria as 'pos_graduacao' | 'musica' || 'pos_graduacao'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="statusProcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Processo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="colaboradorResponsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colaborador Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataPrevisaoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previsão de Entrega</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataConclusao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Conclusão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numeroProcesso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Processo</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do processo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a certificação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}