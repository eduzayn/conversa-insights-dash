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
  GraduationCap, BookOpen, Clock, Users, ArrowLeft
} from 'lucide-react';

interface AcademicCourse {
  id: number;
  nome: string;
  categoria: string;
  areaConhecimento: string;
  modalidade: string;
  cargaHoraria: number;
  status: string;
  descricao?: string;
  coordenador?: string;
  valorMensalidade?: number;
  duracaoMeses?: number;
  createdAt?: string;
  updatedAt?: string;
}

const CursosAcademicos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<AcademicCourse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar cursos
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/academic/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/courses');
      return response as AcademicCourse[];
    }
  });

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: async (data: Partial<AcademicCourse>) => {
      return apiRequest('/api/academic/courses', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/courses'] });
      setIsCreateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Curso criado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar curso', variant: 'destructive' });
    }
  });

  // Mutation para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AcademicCourse> & { id: number }) => {
      return apiRequest(`/api/academic/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/courses'] });
      setIsEditModalOpen(false);
      setSelectedCourse(null);
      toast({ title: 'Sucesso', description: 'Curso atualizado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar curso', variant: 'destructive' });
    }
  });

  // Mutation para deletar curso
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/academic/courses/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/courses'] });
      toast({ title: 'Sucesso', description: 'Curso removido com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao remover curso', variant: 'destructive' });
    }
  });

  // Filtrar cursos
  const filteredCourses = React.useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = !searchTerm || 
        course.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.areaConhecimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.coordenador?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategoria = categoriaFilter === 'all' || course.categoria === categoriaFilter;
      const matchesModalidade = modalidadeFilter === 'all' || course.modalidade === modalidadeFilter;
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;

      return matchesSearch && matchesCategoria && matchesModalidade && matchesStatus;
    });
  }, [courses, searchTerm, categoriaFilter, modalidadeFilter, statusFilter]);

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const configs = {
      ativo: { variant: 'default' as const, color: 'text-green-600' },
      inativo: { variant: 'secondary' as const, color: 'text-gray-600' },
      em_desenvolvimento: { variant: 'outline' as const, color: 'text-blue-600' },
      descontinuado: { variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = configs[status as keyof typeof configs] || configs.ativo;

    return (
      <Badge variant={config.variant} className="gap-1">
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const CourseForm = ({ course, onSubmit, onCancel }: {
    course?: AcademicCourse | null;
    onSubmit: (data: Partial<AcademicCourse>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      nome: course?.nome || '',
      categoria: course?.categoria || '',
      areaConhecimento: course?.areaConhecimento || '',
      modalidade: course?.modalidade || '',
      cargaHoraria: course?.cargaHoraria || 0,
      status: course?.status || 'ativo',
      descricao: course?.descricao || '',
      coordenador: course?.coordenador || '',
      valorMensalidade: course?.valorMensalidade || 0,
      duracaoMeses: course?.duracaoMeses || 0
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome do Curso</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                <SelectItem value="graduacao">Graduação</SelectItem>
                <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                <SelectItem value="capacitacao">Capacitação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="areaConhecimento">Área do Conhecimento</Label>
            <Input
              id="areaConhecimento"
              value={formData.areaConhecimento}
              onChange={(e) => setFormData({ ...formData, areaConhecimento: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="modalidade">Modalidade</Label>
            <Select value={formData.modalidade} onValueChange={(value) => setFormData({ ...formData, modalidade: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ead">EAD</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cargaHoraria">Carga Horária</Label>
            <Input
              id="cargaHoraria"
              type="number"
              value={formData.cargaHoraria}
              onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <Label htmlFor="duracaoMeses">Duração (meses)</Label>
            <Input
              id="duracaoMeses"
              type="number"
              value={formData.duracaoMeses}
              onChange={(e) => setFormData({ ...formData, duracaoMeses: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="valorMensalidade">Valor Mensalidade (R$)</Label>
            <Input
              id="valorMensalidade"
              type="number"
              step="0.01"
              value={formData.valorMensalidade}
              onChange={(e) => setFormData({ ...formData, valorMensalidade: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="coordenador">Coordenador</Label>
            <Input
              id="coordenador"
              value={formData.coordenador}
              onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })}
            />
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
                <SelectItem value="em_desenvolvimento">Em Desenvolvimento</SelectItem>
                <SelectItem value="descontinuado">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {course ? 'Atualizar' : 'Criar'} Curso
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
            <h1 className="text-3xl font-bold">Cursos Acadêmicos</h1>
            <p className="text-muted-foreground">Gestão completa de cursos e programas acadêmicos</p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Curso</DialogTitle>
            </DialogHeader>
            <CourseForm
              onSubmit={(data) => createCourseMutation.mutate(data)}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pós-Graduação</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {courses.filter(c => c.categoria === 'pos_graduacao').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carga Horária Total</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {courses.reduce((total, course) => total + course.cargaHoraria, 0)}h
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
                placeholder="Buscar por nome, área, coordenador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
                <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
                <SelectItem value="graduacao">Graduação</SelectItem>
                <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                <SelectItem value="capacitacao">Capacitação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Modalidades</SelectItem>
                <SelectItem value="ead">EAD</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
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
                <SelectItem value="em_desenvolvimento">Em Desenvolvimento</SelectItem>
                <SelectItem value="descontinuado">Descontinuado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Cursos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cursos</CardTitle>
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
                  <TableHead>Nome do Curso</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.nome}</div>
                        <div className="text-sm text-muted-foreground">{course.areaConhecimento}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {course.categoria.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.modalidade.toUpperCase()}</TableCell>
                    <TableCell>{course.cargaHoraria}h</TableCell>
                    <TableCell>{course.coordenador || 'Não definido'}</TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este curso?')) {
                              deleteCourseMutation.mutate(course.id);
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
            <DialogTitle>Detalhes do Curso</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Curso</Label>
                  <p className="font-medium">{selectedCourse.nome}</p>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <p>{selectedCourse.categoria.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Modalidade</Label>
                  <p>{selectedCourse.modalidade.toUpperCase()}</p>
                </div>
                <div>
                  <Label>Carga Horária</Label>
                  <p>{selectedCourse.cargaHoraria}h</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>{getStatusBadge(selectedCourse.status)}</p>
                </div>
              </div>
              {selectedCourse.descricao && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-muted-foreground">{selectedCourse.descricao}</p>
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
            <DialogTitle>Editar Curso</DialogTitle>
          </DialogHeader>
          <CourseForm
            course={selectedCourse}
            onSubmit={(data) => updateCourseMutation.mutate({ ...data, id: selectedCourse!.id })}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedCourse(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CursosAcademicos;