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
  BookOpen, Clock, GraduationCap, ArrowLeft, ChevronDown, ChevronRight
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
  cargaHoraria: number;
}

const MatrizesCurriculares = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cursoFilter, setCursoFilter] = useState<string>('all');
  const [periodoFilter, setPeriodoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<number[]>([]);

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
            <h1 className="text-3xl font-bold">Matrizes Curriculares</h1>
            <p className="text-muted-foreground">Gestão de disciplinas e estrutura curricular dos cursos</p>
          </div>
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
    </div>
  );
};

export default MatrizesCurriculares;