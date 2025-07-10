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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, 
  BookOpen, Clock, GraduationCap, ArrowLeft, ChevronDown, ChevronRight,
  School, Users, FileText
} from 'lucide-react';

interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  cargaHoraria: number;
  periodo: number;
  tipo: string; // obrigatoria, optativa, eletiva
  prerequeisitos?: string[];
  ementa?: string;
  professorId?: number;
  professor?: {
    id: number;
    nome: string;
  };
  courseId: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Curso {
  id: number;
  nome: string;
  categoria: string;
  areaConhecimento: string;
  modalidade: string;
  cargaHoraria: number;
  duracao?: string;
  preco?: number;
  status: string;
  coordenadorId?: number;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
}

const MatrizesCurriculares = () => {
  // Estados para disciplinas
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFilter, setCursoFilter] = useState<string>('all');
  const [periodoFilter, setPeriodoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<number[]>([]);

  // Estados para cursos
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Curso | null>(null);
  const [isCourseCreateModalOpen, setIsCourseCreateModalOpen] = useState(false);
  const [isCourseEditModalOpen, setIsCourseEditModalOpen] = useState(false);
  const [isCourseViewModalOpen, setIsCourseViewModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar disciplinas
  const { data: disciplinas = [], isLoading } = useQuery({
    queryKey: ['/api/academic/disciplines'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/disciplines');
      return response as Disciplina[];
    }
  });

  // Buscar cursos
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/academic/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/courses');
      return response as Curso[];
    }
  });

  // Buscar professores
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/academic/professors'],
    queryFn: async () => {
      const response = await apiRequest('/api/academic/professors');
      return response;
    }
  });

  // Mutation para criar disciplina
  const createDisciplinaMutation = useMutation({
    mutationFn: async (data: Partial<Disciplina>) => {
      return apiRequest('/api/academic/disciplines', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/disciplines'] });
      setIsCreateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Disciplina criada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar disciplina', variant: 'destructive' });
    }
  });

  // Mutation para atualizar disciplina
  const updateDisciplinaMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Disciplina> & { id: number }) => {
      return apiRequest(`/api/academic/disciplines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/disciplines'] });
      setIsEditModalOpen(false);
      setSelectedDisciplina(null);
      toast({ title: 'Sucesso', description: 'Disciplina atualizada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar disciplina', variant: 'destructive' });
    }
  });

  // Mutation para deletar disciplina
  const deleteDisciplinaMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/academic/disciplines/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/disciplines'] });
      toast({ title: 'Sucesso', description: 'Disciplina removida com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao remover disciplina', variant: 'destructive' });
    }
  });

  // Mutations para cursos
  const createCourseMutation = useMutation({
    mutationFn: async (data: Partial<Curso>) => {
      return apiRequest('/api/academic/courses', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/courses'] });
      setIsCourseCreateModalOpen(false);
      toast({ title: 'Sucesso', description: 'Curso criado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar curso', variant: 'destructive' });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Curso> & { id: number }) => {
      return apiRequest(`/api/academic/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic/courses'] });
      setIsCourseEditModalOpen(false);
      setSelectedCourse(null);
      toast({ title: 'Sucesso', description: 'Curso atualizado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar curso', variant: 'destructive' });
    }
  });

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

  // Filtrar disciplinas
  const filteredDisciplinas = React.useMemo(() => {
    return disciplinas.filter(disciplina => {
      const matchesSearch = !searchTerm || 
        disciplina.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disciplina.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disciplina.professor?.nome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCurso = cursoFilter === 'all' || disciplina.courseId.toString() === cursoFilter;
      const matchesPeriodo = periodoFilter === 'all' || disciplina.periodo.toString() === periodoFilter;
      const matchesTipo = tipoFilter === 'all' || disciplina.tipo === tipoFilter;

      return matchesSearch && matchesCurso && matchesPeriodo && matchesTipo;
    });
  }, [disciplinas, searchTerm, cursoFilter, periodoFilter, tipoFilter]);

  // Filtrar cursos
  const filteredCourses = React.useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = !courseSearchTerm || 
        course.nome.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
        course.areaConhecimento.toLowerCase().includes(courseSearchTerm.toLowerCase());

      const matchesCategoria = categoriaFilter === 'all' || course.categoria === categoriaFilter;
      const matchesModalidade = modalidadeFilter === 'all' || course.modalidade === modalidadeFilter;
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;

      return matchesSearch && matchesCategoria && matchesModalidade && matchesStatus;
    });
  }, [courses, courseSearchTerm, categoriaFilter, modalidadeFilter, statusFilter]);

  // Agrupar disciplinas por curso
  const disciplinasPorCurso = React.useMemo(() => {
    const groups: { [key: number]: { curso: Curso; disciplinas: Disciplina[] } } = {};
    
    filteredDisciplinas.forEach(disciplina => {
      const curso = courses.find(c => c.id === disciplina.courseId);
      if (curso) {
        if (!groups[curso.id]) {
          groups[curso.id] = { curso, disciplinas: [] };
        }
        groups[curso.id].disciplinas.push(disciplina);
      }
    });

    return Object.values(groups).sort((a, b) => a.curso.nome.localeCompare(b.curso.nome));
  }, [filteredDisciplinas, courses]);

  // Função para obter badge de tipo
  const getTipoBadge = (tipo: string) => {
    const configs = {
      obrigatoria: { variant: 'default' as const, color: 'text-blue-600' },
      optativa: { variant: 'secondary' as const, color: 'text-green-600' },
      eletiva: { variant: 'outline' as const, color: 'text-purple-600' }
    };

    const config = configs[tipo as keyof typeof configs] || configs.obrigatoria;

    return (
      <Badge variant={config.variant}>
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </Badge>
    );
  };

  const toggleCourseExpansion = (courseId: number) => {
    setExpandedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Função para obter badge de status do curso
  const getStatusBadge = (status: string) => {
    const configs = {
      ativo: { variant: 'default' as const, color: 'text-green-600' },
      inativo: { variant: 'secondary' as const, color: 'text-gray-600' },
      'em_desenvolvimento': { variant: 'outline' as const, color: 'text-yellow-600' }
    };

    const config = configs[status as keyof typeof configs] || configs.ativo;

    return (
      <Badge variant={config.variant}>
        {status === 'em_desenvolvimento' ? 'Em Desenvolvimento' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const CourseForm = ({ course, onSubmit, onCancel }: {
    course?: Curso | null;
    onSubmit: (data: Partial<Curso>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      nome: course?.nome || '',
      categoria: course?.categoria || '',
      areaConhecimento: course?.areaConhecimento || '',
      modalidade: course?.modalidade || '',
      cargaHoraria: course?.cargaHoraria || 0,
      duracao: course?.duracao || '',
      preco: course?.preco || 0,
      status: course?.status || 'ativo',
      coordenadorId: course?.coordenadorId || 0,
      descricao: course?.descricao || ''
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
                <SelectItem value="graduacao">Graduação</SelectItem>
                <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                <SelectItem value="capacitacao">Capacitação</SelectItem>
                <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                <SelectItem value="eja">EJA</SelectItem>
                <SelectItem value="sequencial">Sequencial</SelectItem>
                <SelectItem value="diplomacao">Diplomação por Competência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="areaConhecimento">Área de Conhecimento</Label>
            <Input
              id="areaConhecimento"
              value={formData.areaConhecimento}
              onChange={(e) => setFormData({ ...formData, areaConhecimento: e.target.value })}
              placeholder="Ex: Ciências Humanas, Ciências Exatas"
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
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="ead">EAD</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
                <SelectItem value="semipresencial">Semipresencial</SelectItem>
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
            <Label htmlFor="duracao">Duração</Label>
            <Input
              id="duracao"
              value={formData.duracao}
              onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
              placeholder="Ex: 4 anos, 2 semestres"
            />
          </div>
          <div>
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={formData.preco}
              onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="coordenadorId">Coordenador</Label>
            <Select value={formData.coordenadorId.toString()} onValueChange={(value) => setFormData({ ...formData, coordenadorId: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o coordenador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Não definido</SelectItem>
                {professors.map((professor: any) => (
                  <SelectItem key={professor.id} value={professor.id.toString()}>
                    {professor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="em_desenvolvimento">Em Desenvolvimento</SelectItem>
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
            rows={4}
            placeholder="Descrição geral do curso, objetivos e perfil do egresso..."
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

  const DisciplinaForm = ({ disciplina, onSubmit, onCancel }: {
    disciplina?: Disciplina | null;
    onSubmit: (data: Partial<Disciplina>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      nome: disciplina?.nome || '',
      codigo: disciplina?.codigo || '',
      cargaHoraria: disciplina?.cargaHoraria || 0,
      periodo: disciplina?.periodo || 1,
      tipo: disciplina?.tipo || 'obrigatoria',
      courseId: disciplina?.courseId || 0,
      professorId: disciplina?.professorId || 0,
      ementa: disciplina?.ementa || '',
      prerequeisitos: disciplina?.prerequeisitos?.join(', ') || '',
      status: disciplina?.status || 'ativo'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        prerequeisitos: formData.prerequeisitos.split(',').map(p => p.trim()).filter(p => p)
      };
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome da Disciplina</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: PSI101, PED201"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="courseId">Curso</Label>
            <Select value={formData.courseId.toString()} onValueChange={(value) => setFormData({ ...formData, courseId: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="professorId">Professor</Label>
            <Select value={formData.professorId.toString()} onValueChange={(value) => setFormData({ ...formData, professorId: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Não definido</SelectItem>
                {professors.map((professor: any) => (
                  <SelectItem key={professor.id} value={professor.id.toString()}>
                    {professor.nome}
                  </SelectItem>
                ))}
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
            <Label htmlFor="periodo">Período</Label>
            <Select value={formData.periodo.toString()} onValueChange={(value) => setFormData({ ...formData, periodo: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8].map(p => (
                  <SelectItem key={p} value={p.toString()}>{p}º Período</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                <SelectItem value="optativa">Optativa</SelectItem>
                <SelectItem value="eletiva">Eletiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="prerequeisitos">Pré-requisitos (separados por vírgula)</Label>
          <Input
            id="prerequeisitos"
            value={formData.prerequeisitos}
            onChange={(e) => setFormData({ ...formData, prerequeisitos: e.target.value })}
            placeholder="Ex: PSI101, MAT201"
          />
        </div>

        <div>
          <Label htmlFor="ementa">Ementa</Label>
          <Textarea
            id="ementa"
            value={formData.ementa}
            onChange={(e) => setFormData({ ...formData, ementa: e.target.value })}
            rows={4}
            placeholder="Descrição dos conteúdos e objetivos da disciplina..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {disciplina ? 'Atualizar' : 'Criar'} Disciplina
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
            <h1 className="text-3xl font-bold">Gestão Acadêmica</h1>
            <p className="text-muted-foreground">Administração completa de cursos e disciplinas</p>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="disciplines" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Disciplinas
          </TabsTrigger>
        </TabsList>

        {/* Aba de Cursos */}
        <TabsContent value="courses" className="space-y-6">
          {/* Header da Aba de Cursos */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Cursos Acadêmicos</h2>
              <p className="text-muted-foreground">Gestão completa dos cursos da instituição</p>
            </div>
            <Dialog open={isCourseCreateModalOpen} onOpenChange={setIsCourseCreateModalOpen}>
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
                  onCancel={() => setIsCourseCreateModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Cards de Estatísticas dos Cursos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
                <GraduationCap className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {courses.filter(c => c.status === 'ativo').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Desenvolvimento</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {courses.filter(c => c.status === 'em_desenvolvimento').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Modalidade EAD</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {courses.filter(c => c.modalidade === 'ead').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros dos Cursos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cursos..."
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="graduacao">Graduação</SelectItem>
                    <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                    <SelectItem value="segunda_graduacao">Segunda Graduação</SelectItem>
                    <SelectItem value="capacitacao">Capacitação</SelectItem>
                    <SelectItem value="formacao_livre">Formação Livre</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Modalidades</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="ead">EAD</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                    <SelectItem value="semipresencial">Semipresencial</SelectItem>
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
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando cursos...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Carga Horária</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Coordenador</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{course.nome}</div>
                            <div className="text-sm text-muted-foreground">{course.areaConhecimento}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {course.categoria.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {course.modalidade.charAt(0).toUpperCase() + course.modalidade.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{course.cargaHoraria}h</TableCell>
                        <TableCell>
                          {getStatusBadge(course.status)}
                        </TableCell>
                        <TableCell>
                          {professors.find((p: any) => p.id === course.coordenadorId)?.nome || 'Não definido'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCourse(course);
                                setIsCourseViewModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCourse(course);
                                setIsCourseEditModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteCourseMutation.mutate(course.id)}
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
        </TabsContent>

        {/* Aba de Disciplinas */}
        <TabsContent value="disciplines" className="space-y-6">
          {/* Header da Aba de Disciplinas */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Disciplinas</h2>
              <p className="text-muted-foreground">Gestão de disciplinas e estrutura curricular dos cursos</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Disciplina
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Disciplina</DialogTitle>
                </DialogHeader>
                <DisciplinaForm
                  onSubmit={(data) => createDisciplinaMutation.mutate(data)}
                  onCancel={() => setIsCreateModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Disciplinas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disciplinas.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obrigatórias</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {disciplinas.filter(d => d.tipo === 'obrigatoria').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optativas</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {disciplinas.filter(d => d.tipo === 'optativa').length}
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
              {disciplinas.reduce((total, disciplina) => total + disciplina.cargaHoraria, 0)}h
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
                placeholder="Buscar por nome, código, professor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={cursoFilter} onValueChange={setCursoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Cursos</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                {[1,2,3,4,5,6,7,8].map(p => (
                  <SelectItem key={p} value={p.toString()}>{p}º Período</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                <SelectItem value="optativa">Optativa</SelectItem>
                <SelectItem value="eletiva">Eletiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Disciplinas por Curso */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          disciplinasPorCurso.map(({ curso, disciplinas }) => (
            <Card key={curso.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleCourseExpansion(curso.id)}
                  >
                    {expandedCourses.includes(curso.id) ? 
                      <ChevronDown className="h-5 w-5" /> : 
                      <ChevronRight className="h-5 w-5" />
                    }
                    <CardTitle className="text-lg">{curso.nome}</CardTitle>
                    <Badge variant="outline">{disciplinas.length} disciplinas</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {disciplinas.reduce((total, d) => total + d.cargaHoraria, 0)}h total
                  </div>
                </div>
              </CardHeader>
              {expandedCourses.includes(curso.id) && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Carga Horária</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disciplinas
                        .sort((a, b) => a.periodo - b.periodo)
                        .map((disciplina) => (
                        <TableRow key={disciplina.id}>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {disciplina.codigo}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{disciplina.nome}</div>
                          </TableCell>
                          <TableCell>{disciplina.periodo}º</TableCell>
                          <TableCell>{getTipoBadge(disciplina.tipo)}</TableCell>
                          <TableCell>{disciplina.cargaHoraria}h</TableCell>
                          <TableCell>
                            {disciplina.professor?.nome || 'Não definido'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDisciplina(disciplina);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDisciplina(disciplina);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover esta disciplina?')) {
                                    deleteDisciplinaMutation.mutate(disciplina.id);
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
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Disciplina</DialogTitle>
          </DialogHeader>
          {selectedDisciplina && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Disciplina</Label>
                  <p className="font-medium">{selectedDisciplina.nome}</p>
                </div>
                <div>
                  <Label>Código</Label>
                  <p>{selectedDisciplina.codigo}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Período</Label>
                  <p>{selectedDisciplina.periodo}º</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <p>{getTipoBadge(selectedDisciplina.tipo)}</p>
                </div>
                <div>
                  <Label>Carga Horária</Label>
                  <p>{selectedDisciplina.cargaHoraria}h</p>
                </div>
              </div>
              {selectedDisciplina.professor && (
                <div>
                  <Label>Professor</Label>
                  <p>{selectedDisciplina.professor.nome}</p>
                </div>
              )}
              {selectedDisciplina.prerequeisitos && selectedDisciplina.prerequeisitos.length > 0 && (
                <div>
                  <Label>Pré-requisitos</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDisciplina.prerequeisitos.map((prereq, index) => (
                      <Badge key={index} variant="outline">{prereq}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedDisciplina.ementa && (
                <div>
                  <Label>Ementa</Label>
                  <p className="text-sm text-muted-foreground">{selectedDisciplina.ementa}</p>
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
            <DialogTitle>Editar Disciplina</DialogTitle>
          </DialogHeader>
          <DisciplinaForm
            disciplina={selectedDisciplina}
            onSubmit={(data) => updateDisciplinaMutation.mutate({ ...data, id: selectedDisciplina!.id })}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedDisciplina(null);
            }}
          />
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>

      {/* Modais para Cursos */}
      {/* Modal de Visualização do Curso */}
      <Dialog open={isCourseViewModalOpen} onOpenChange={setIsCourseViewModalOpen}>
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
                  <p>{selectedCourse.categoria.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Área de Conhecimento</Label>
                  <p>{selectedCourse.areaConhecimento}</p>
                </div>
                <div>
                  <Label>Modalidade</Label>
                  <p>{selectedCourse.modalidade.charAt(0).toUpperCase() + selectedCourse.modalidade.slice(1)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Carga Horária</Label>
                  <p>{selectedCourse.cargaHoraria}h</p>
                </div>
                <div>
                  <Label>Duração</Label>
                  <p>{selectedCourse.duracao || 'Não definida'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>{getStatusBadge(selectedCourse.status)}</p>
                </div>
              </div>
              {selectedCourse.preco && (
                <div>
                  <Label>Preço</Label>
                  <p>R$ {selectedCourse.preco.toFixed(2)}</p>
                </div>
              )}
              {selectedCourse.coordenadorId && (
                <div>
                  <Label>Coordenador</Label>
                  <p>{professors.find((p: any) => p.id === selectedCourse.coordenadorId)?.nome || 'Não encontrado'}</p>
                </div>
              )}
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

      {/* Modal de Edição do Curso */}
      <Dialog open={isCourseEditModalOpen} onOpenChange={setIsCourseEditModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
          </DialogHeader>
          <CourseForm
            course={selectedCourse}
            onSubmit={(data) => updateCourseMutation.mutate({ ...data, id: selectedCourse!.id })}
            onCancel={() => {
              setIsCourseEditModalOpen(false);
              setSelectedCourse(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatrizesCurriculares;