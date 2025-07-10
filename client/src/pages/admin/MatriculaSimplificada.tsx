import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  X,
  UserPlus,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema para validação do formulário
const enrollmentSchema = z.object({
  studentName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  studentEmail: z.string().email('Email inválido'),
  studentCpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  studentPhone: z.string().optional(),
  courseId: z.number().min(1, 'Selecione um curso'),
  consultantId: z.number().min(1, 'Selecione um consultor'),
  tenantId: z.number().min(1, 'Selecione uma equipe'),
  amount: z.number().min(1, 'Valor deve ser maior que 0'),
  installments: z.number().min(1).max(12, 'Máximo 12 parcelas'),
  paymentMethod: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX']),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface SimplifiedEnrollment {
  id: number;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  studentPhone?: string;
  courseId: number;
  consultantId: number;
  tenantId: number;
  amount: number;
  installments: number;
  paymentMethod: string;
  status: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  nome: string;
  modalidade: string;
  categoria: string;
  cargaHoraria: number;
  preco: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  nome?: string;
}

interface Team {
  id: number;
  name: string;
  description?: string;
}

export default function MatriculaSimplificada() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentName: '',
      studentEmail: '',
      studentCpf: '',
      studentPhone: '',
      courseId: 0,
      consultantId: 0,
      tenantId: 1, // Equipe padrão
      amount: 0,
      installments: 1,
      paymentMethod: 'BOLETO',
    },
  });

  // Buscar matrículas simplificadas
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['/api/simplified-enrollments'],
    queryFn: () => apiRequest('/api/simplified-enrollments'),
  });

  // Buscar cursos
  const { data: coursesData = [] } = useQuery({
    queryKey: ['/api/cursos-pre-cadastrados'],
    queryFn: () => apiRequest('/api/cursos-pre-cadastrados'),
  });
  const courses = Array.isArray(coursesData) ? coursesData : [];

  // Buscar usuários (consultores)
  const { data: usersData = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users'),
  });
  const users = Array.isArray(usersData) ? usersData : [];

  // Buscar equipes
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: () => apiRequest('/api/teams'),
  });
  const teams = Array.isArray(teamsData) ? teamsData : [];

  // Mutation para criar matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: (data: EnrollmentFormData) => 
      apiRequest('/api/simplified-enrollments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Matrícula criada",
        description: "Matrícula simplificada criada com sucesso!",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/simplified-enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message || "Falha ao criar matrícula",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/simplified-enrollments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "Status da matrícula atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/simplified-enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Falha ao atualizar status",
        variant: "destructive",
      });
    },
  });

  // Filtrar matrículas - garantir que é um array
  const enrollmentsList = Array.isArray(enrollments) ? enrollments : [];
  const filteredEnrollments = enrollmentsList.filter((enrollment: SimplifiedEnrollment) => {
    const matchesSearch = enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'waiting_payment': { label: 'Aguardando Pagamento', className: 'bg-blue-100 text-blue-800', icon: CreditCard },
      'payment_confirmed': { label: 'Pagamento Confirmado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'completed': { label: 'Concluída', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'cancelled': { label: 'Cancelada', className: 'bg-red-100 text-red-800', icon: XCircle },
      'failed': { label: 'Falha', className: 'bg-red-100 text-red-800', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Formatação de valores
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const onSubmit = (data: EnrollmentFormData) => {
    createEnrollmentMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Matrícula Simplificada</h1>
          <p className="text-muted-foreground">
            Sistema de matrícula rápida com integração automática ao Asaas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Matrícula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Matrícula</DialogTitle>
              <DialogDescription>
                Preencha os dados do aluno para criar uma matrícula simplificada
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Digite o email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentCpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Curso *</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o curso" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course: Course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.nome} - {formatCurrency(course.preco * 100)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consultantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultor *</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o consultor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.filter((user: User) => user.role === 'admin' || user.role === 'agent').map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.nome || user.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipe *</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a equipe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teams.map((team: Team) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) * 100)}
                          />
                        </FormControl>
                        <FormDescription>
                          Valor será convertido automaticamente para centavos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcelas *</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Número de parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BOLETO">Boleto</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEnrollmentMutation.isPending}
                  >
                    {createEnrollmentMutation.isPending ? 'Criando...' : 'Criar Matrícula'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="waiting_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Matrículas */}
      <Card>
        <CardHeader>
          <CardTitle>Matrículas Simplificadas</CardTitle>
          <CardDescription>
            {filteredEnrollments.length} matrícula(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEnrollments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando matrículas...</p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma matrícula encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnrollments.map((enrollment: SimplifiedEnrollment) => (
                <div key={enrollment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{enrollment.studentName}</h3>
                        {getStatusBadge(enrollment.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{enrollment.studentEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{enrollment.studentCpf}</span>
                        </div>
                        {enrollment.studentPhone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{enrollment.studentPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(enrollment.amount)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{enrollment.installments}x - {enrollment.paymentMethod}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(enrollment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {enrollment.paymentUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <a href={enrollment.paymentUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Pagamento
                          </a>
                        </Button>
                      )}
                      <Select 
                        value={enrollment.status} 
                        onValueChange={(status) => updateStatusMutation.mutate({ id: enrollment.id, status })}
                      >
                        <SelectTrigger className="w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="waiting_payment">Aguardando Pagamento</SelectItem>
                          <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="failed">Falha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}