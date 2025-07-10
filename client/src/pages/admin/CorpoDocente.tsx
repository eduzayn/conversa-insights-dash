import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, 
  Users, Mail, Phone, GraduationCap, BookOpen, ArrowLeft
} from 'lucide-react';

interface Professor {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  especialidade: string;
  titulacao: string;
  status: string;
  disciplinas?: string[];
  biografia?: string;
  lattes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CorpoDocente = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [especialidadeFilter, setEspecialidadeFilter] = useState<string>('all');
  const [titulacaoFilter, setTitulacaoFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar professores
  const { data: professors = [], isLoading } = useQuery({
    queryKey: ['/api/academic/professors'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/professors');
      return response as Professor[];
    }
  });

  // Mutation para criar professor
  const createProfessorMutation = useMutation({
    mutationFn: async (data: Partial<Professor>) => {
      return apiRequest('/api/academic/professors', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/professors'] });
      setIsCreateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Professor cadastrado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao cadastrar professor', variant: 'destructive' });
    }
  });

  // Mutation para atualizar professor
  const updateProfessorMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Professor> & { id: number }) => {
      return apiRequest(`/api/academic/professors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/professors'] });
      setIsEditModalOpen(false);
      setSelectedProfessor(null);
      toast({ title: 'Sucesso', description: 'Professor atualizado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar professor', variant: 'destructive' });
    }
  });

  // Mutation para deletar professor
  const deleteProfessorMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/academic/professors/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/professors'] });
      toast({ title: 'Sucesso', description: 'Professor removido com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao remover professor', variant: 'destructive' });
    }
  });

  // Filtrar professores
  const filteredProfessors = React.useMemo(() => {
    return professors.filter(professor => {
      const matchesSearch = !searchTerm || 
        professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professor.especialidade.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEspecialidade = especialidadeFilter === 'all' || professor.especialidade === especialidadeFilter;
      const matchesTitulacao = titulacaoFilter === 'all' || professor.titulacao === titulacaoFilter;
      const matchesStatus = statusFilter === 'all' || professor.status === statusFilter;

      return matchesSearch && matchesEspecialidade && matchesTitulacao && matchesStatus;
    });
  }, [professors, searchTerm, especialidadeFilter, titulacaoFilter, statusFilter]);

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const configs = {
      ativo: { variant: 'default' as const, color: 'text-green-600' },
      inativo: { variant: 'secondary' as const, color: 'text-gray-600' },
      licenca: { variant: 'outline' as const, color: 'text-blue-600' },
      afastado: { variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = configs[status as keyof typeof configs] || configs.ativo;

    return (
      <Badge variant={config.variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const ProfessorForm = ({ professor, onSubmit, onCancel }: {
    professor?: Professor | null;
    onSubmit: (data: Partial<Professor>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      nome: professor?.nome || '',
      email: professor?.email || '',
      telefone: professor?.telefone || '',
      especialidade: professor?.especialidade || '',
      titulacao: professor?.titulacao || '',
      status: professor?.status || 'ativo',
      biografia: professor?.biografia || '',
      lattes: professor?.lattes || '',
      disciplinas: professor?.disciplinas?.join(', ') || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        disciplinas: formData.disciplinas.split(',').map(d => d.trim()).filter(d => d)
      };
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input
              id="especialidade"
              value={formData.especialidade}
              onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="titulacao">Titulação</Label>
            <Select value={formData.titulacao} onValueChange={(value) => setFormData({ ...formData, titulacao: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a titulação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graduacao">Graduação</SelectItem>
                <SelectItem value="especializacao">Especialização</SelectItem>
                <SelectItem value="mestrado">Mestrado</SelectItem>
                <SelectItem value="doutorado">Doutorado</SelectItem>
                <SelectItem value="pos_doutorado">Pós-Doutorado</SelectItem>
                <SelectItem value="livre_docencia">Livre Docência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="licenca">Em Licença</SelectItem>
                <SelectItem value="afastado">Afastado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="disciplinas">Disciplinas (separadas por vírgula)</Label>
          <Input
            id="disciplinas"
            value={formData.disciplinas}
            onChange={(e) => setFormData({ ...formData, disciplinas: e.target.value })}
            placeholder="Ex: Psicologia Clínica, Terapia Familiar, Neuropsicologia"
          />
        </div>

        <div>
          <Label htmlFor="lattes">Link do Currículo Lattes</Label>
          <Input
            id="lattes"
            type="url"
            value={formData.lattes}
            onChange={(e) => setFormData({ ...formData, lattes: e.target.value })}
            placeholder="http://lattes.cnpq.br/..."
          />
        </div>

        <div>
          <Label htmlFor="biografia">Biografia/Mini CV</Label>
          <Textarea
            id="biografia"
            value={formData.biografia}
            onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
            rows={3}
            placeholder="Formação acadêmica, experiência profissional, áreas de pesquisa..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {professor ? 'Atualizar' : 'Cadastrar'} Professor
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Corpo Docente</h1>
            <p className="text-muted-foreground">Gestão de professores e coordenadores acadêmicos</p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Professor</DialogTitle>
            </DialogHeader>
            <ProfessorForm
              onSubmit={(data) => createProfessorMutation.mutate(data)}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Professores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professors.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores Ativos</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {professors.filter(p => p.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doutores</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {professors.filter(p => p.titulacao === 'doutorado' || p.titulacao === 'pos_doutorado').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mestres</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {professors.filter(p => p.titulacao === 'mestrado').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={especialidadeFilter} onValueChange={setEspecialidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Especialidades</SelectItem>
                <SelectItem value="Psicologia">Psicologia</SelectItem>
                <SelectItem value="Pedagogia">Pedagogia</SelectItem>
                <SelectItem value="Educação">Educação</SelectItem>
                <SelectItem value="Educação Física">Educação Física</SelectItem>
                <SelectItem value="Letras">Letras</SelectItem>
                <SelectItem value="Matemática">Matemática</SelectItem>
                <SelectItem value="História">História</SelectItem>
                <SelectItem value="Geografia">Geografia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={titulacaoFilter} onValueChange={setTitulacaoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Titulação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Titulações</SelectItem>
                <SelectItem value="graduacao">Graduação</SelectItem>
                <SelectItem value="especializacao">Especialização</SelectItem>
                <SelectItem value="mestrado">Mestrado</SelectItem>
                <SelectItem value="doutorado">Doutorado</SelectItem>
                <SelectItem value="pos_doutorado">Pós-Doutorado</SelectItem>
                <SelectItem value="livre_docencia">Livre Docência</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="licenca">Em Licença</SelectItem>
                <SelectItem value="afastado">Afastado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Professores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Professores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Titulação</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Disciplinas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessors.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{professor.nome}</div>
                        <div className="text-sm text-muted-foreground">{professor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{professor.especialidade}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {professor.titulacao.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {professor.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {professor.telefone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {professor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {professor.disciplinas?.slice(0, 2).map((disciplina, index) => (
                          <div key={index}>{disciplina}</div>
                        ))}
                        {professor.disciplinas && professor.disciplinas.length > 2 && (
                          <div className="text-muted-foreground">
                            +{professor.disciplinas.length - 2} mais
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(professor.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProfessor(professor);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProfessor(professor);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este professor?')) {
                              deleteProfessorMutation.mutate(professor.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Perfil do Professor</DialogTitle>
          </DialogHeader>
          {selectedProfessor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <p className="font-medium">{selectedProfessor.nome}</p>
                </div>
                <div>
                  <Label>Especialidade</Label>
                  <p>{selectedProfessor.especialidade}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Titulação</Label>
                  <p>{selectedProfessor.titulacao.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{selectedProfessor.email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>{getStatusBadge(selectedProfessor.status)}</p>
                </div>
              </div>
              {selectedProfessor.disciplinas && selectedProfessor.disciplinas.length > 0 && (
                <div>
                  <Label>Disciplinas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedProfessor.disciplinas.map((disciplina, index) => (
                      <Badge key={index} variant="outline">{disciplina}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedProfessor.biografia && (
                <div>
                  <Label>Biografia</Label>
                  <p className="text-sm text-muted-foreground">{selectedProfessor.biografia}</p>
                </div>
              )}
              {selectedProfessor.lattes && (
                <div>
                  <Label>Currículo Lattes</Label>
                  <a 
                    href={selectedProfessor.lattes} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver currículo completo
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
          </DialogHeader>
          <ProfessorForm
            professor={selectedProfessor}
            onSubmit={(data) => updateProfessorMutation.mutate({ ...data, id: selectedProfessor!.id })}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedProfessor(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorpoDocente;