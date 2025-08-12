/**
 * Página principal de Certificações - REFATORADA
 * 
 * Arquivo refatorado em componentes modulares para melhor manutenção
 * Mantém exatamente a mesma funcionalidade e aparência do arquivo original
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/layout/Sidebar';
import type { Certification } from '@shared/schema';

// Importar hooks e componentes modulares
import { useCertifications, usePreRegisteredCourses, useEditPreRegisteredCourses } from '@/hooks/useCertifications';
import { CertificationFilters } from '@/components/certifications/CertificationFilters';
import { CertificationCard } from '@/components/certifications/CertificationCard';
import { CertificationForm } from '@/components/certifications/CertificationForm';
import { NewCourseDialog } from '@/components/certifications/NewCourseDialog';
import { DuplicateAlert } from '@/components/certifications/DuplicateAlert';
import { CertificationPagination } from '@/components/certifications/CertificationPagination';
import { TABS_CONFIG, CategoriaKey, Status, FinanceiroStatus, DocumentacaoStatus, RequisitosStatus } from '@/constants/certifications';

// Schema Zod para validação e transformação de dados
const CertSchema = z.object({
  id: z.number().optional(),
  aluno: z.string().min(1, 'Nome do aluno é obrigatório'),
  cpf: z.string().optional(),
  modalidade: z.string().optional(),
  curso: z.string().optional(),
  cargaHoraria: z.preprocess(v => Number(v ?? 0), z.number().int().nonnegative()),
  financeiro: z.string().default('em_dia'),
  documentacao: z.string().default('pendente'),
  plataforma: z.string().default('pendente'),
  tutoria: z.string().optional(),
  observacao: z.string().optional(),
  inicioCertificacao: z.string().optional(),
  dataPrevista: z.string().optional(),
  diploma: z.string().optional(),
  status: z.string().default('pendente'),
  categoria: z.string(),
  tcc: z.string().default('nao_possui'),
  praticasPedagogicas: z.string().default('nao_possui'),
  estagio: z.string().default('nao_possui')
});

export default function Certificacoes() {
  // Estados para filtros e paginação
  const [activeTab, setActiveTab] = useState<CategoriaKey>('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'todos'>('todos');
  const [filterTipoData, setFilterTipoData] = useState('data_prevista');
  const [filterPeriodo, setFilterPeriodo] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Ref para o container de virtualização
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Ref para o scroll parent (main element)
  const scrollParentRef = useRef<HTMLDivElement | null>(null);

  // Estados para modais e formulários
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNewCourseDialogOpen, setIsNewCourseDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Estados para busca de cursos
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [editCourseSearchOpen, setEditCourseSearchOpen] = useState(false);

  // Hook customizado para certificações com cache otimizado
  const {
    certificationsData,
    certifications,
    totalCertifications,
    totalPages,
    isLoading,
    isInitialLoading,
    isFetching,
    isPreviousData,
    certificationsError,
    refetch,
    getCategoriaFromTab,
    createMutation,
    updateMutation,
    deleteMutation,
    createCourseMutation
  } = useCertifications(
    activeTab,
    searchTerm,
    filterStatus,
    filterTipoData,
    filterPeriodo,
    dataInicio,
    dataFim,
    currentPage,
    pageSize
  );

  // Hooks para cursos pré-cadastrados
  const preRegisteredCourses = usePreRegisteredCourses(getCategoriaFromTab(activeTab));
  const editPreRegisteredCourses = useEditPreRegisteredCourses(
    selectedCertification?.categoria, 
    !!selectedCertification
  );

  // Estado inicial para nova certificação
  const [newCertification, setNewCertification] = useState({
    aluno: '',
    cpf: '',
    modalidade: '',
    curso: '',
    cargaHoraria: '',
    financeiro: 'em_dia',
    documentacao: 'pendente',
    plataforma: 'pendente',
    tutoria: '',
    observacao: '',
    inicioCertificacao: '',
    dataPrevista: '',
    diploma: '',
    status: 'pendente',
    categoria: getCategoriaFromTab(activeTab),
    tcc: 'nao_possui',
    praticasPedagogicas: 'nao_possui',
    estagio: 'nao_possui'
  });

  // Estado para novo curso
  const [newCourseData, setNewCourseData] = useState({ nome: '', cargaHoraria: '' });



  // Algoritmo de detecção de duplicatas O(n) otimizado
  const duplicates = useMemo(() => {
    const byAluno: Record<string, Certification[]> = {};
    for (const cert of certifications) {
      if (!cert.aluno || !cert.curso) continue;
      const key = cert.aluno.trim().toLowerCase();
      (byAluno[key] ??= []).push(cert);
    }

    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const result: Record<string, Certification[]> = {};
    for (const [alunoKey, certs] of Object.entries(byAluno)) {
      // Map curso normalizado -> itens
      const byCurso: Record<string, Certification[]> = {};
      for (const c of certs) {
        const n = normalize(c.curso ?? '');
        (byCurso[n] ??= []).push(c);
      }
      // Formar grupos com 2+ itens
      for (const [cursoKey, list] of Object.entries(byCurso)) {
        if (list.length >= 2) {
          const idA = Math.min(...list.map(i => i.id));
          const idB = Math.max(...list.map(i => i.id));
          result[`${alunoKey}-${idA}-${idB}-${cursoKey}`] = list;
        }
      }
    }
    return result;
  }, [certifications]);

  // Debounce para searchTerm - evita refetch a cada tecla digitada
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Virtualização dos cards de certificação
  const rowVirtualizer = useVirtualizer({
    count: certifications.length,
    getScrollElement: () => scrollParentRef.current,
    // altura estimada de cada card; ajuste se seus cards forem maiores/menores
    estimateSize: () => 140,
    overscan: 12,
    // permite alturas dinâmicas (mede o elemento real quando renderiza)
    measureElement:
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? (el: Element) => (el as HTMLElement).getBoundingClientRect().height
        : undefined,
  });

  // Atualizar categoria quando muda a aba
  useEffect(() => {
    setNewCertification(prev => ({
      ...prev,
      categoria: getCategoriaFromTab(activeTab)
    }));
    setCurrentPage(1);
  }, [activeTab, getCategoriaFromTab]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTipoData, filterPeriodo, dataInicio, dataFim]);

  // Funções de manipulação de eventos com validação Zod
  const handleCreateCertification = (raw?: any) => {
    try {
      const parsed = CertSchema.parse(raw ?? newCertification);
      createMutation.mutate(parsed, {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setNewCertification({
            aluno: '',
            cpf: '',
            modalidade: '',
            curso: '',
            cargaHoraria: '',
            financeiro: 'em_dia',
            documentacao: 'pendente',
            plataforma: 'pendente',
            tutoria: '',
            observacao: '',
            inicioCertificacao: '',
            dataPrevista: '',
            diploma: '',
            status: 'pendente',
            categoria: getCategoriaFromTab(activeTab),
            tcc: 'nao_possui',
            praticasPedagogicas: 'nao_possui',
            estagio: 'nao_possui'
          });
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Erro de validação: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        toast.error('Erro ao criar certificação');
      }
    }
  };

  const handleUpdateCertification = (data: any) => {
    if (!selectedCertification) return;
    
    try {
      const parsed = CertSchema.parse({ ...data, id: selectedCertification.id });
      updateMutation.mutate(parsed, {
        onSuccess: () => {
          setSelectedCertification(null);
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Erro de validação: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        toast.error('Erro ao atualizar certificação');
      }
    }
  };

  const handleDeleteCertification = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
      }
    });
  };

  const handleDuplicateCertification = (certification: Certification) => {
    try {
      const duplicatedData = CertSchema.parse({
        aluno: certification.aluno,
        cpf: certification.cpf || '',
        modalidade: certification.modalidade || '',
        curso: '',
        cargaHoraria: 0, // Usar número diretamente para duplicação
        financeiro: certification.financeiro || 'em_dia',
        documentacao: certification.documentacao || 'pendente',
        plataforma: certification.plataforma || 'pendente',
        tutoria: certification.tutoria || '',
        observacao: `Duplicado de: ${certification.curso ?? 'Curso não informado'}`,
        inicioCertificacao: '',
        dataPrevista: '',
        diploma: '',
        status: 'pendente',
        categoria: getCategoriaFromTab(activeTab),
        tcc: certification.tcc || 'nao_possui',
        praticasPedagogicas: certification.praticasPedagogicas || 'nao_possui',
        estagio: certification.estagio || 'nao_possui'
      });
      
      // Converter de volta para formato do formulário (string para cargaHoraria)
      const formData = { 
        ...duplicatedData, 
        cargaHoraria: '',
        cpf: duplicatedData.cpf || '',
        modalidade: duplicatedData.modalidade || '',
        curso: duplicatedData.curso || '',
        tutoria: duplicatedData.tutoria || '',
        observacao: duplicatedData.observacao || '',
        inicioCertificacao: duplicatedData.inicioCertificacao || '',
        dataPrevista: duplicatedData.dataPrevista || '',
        diploma: duplicatedData.diploma || ''
      };
      setNewCertification(formData);
      setIsCreateDialogOpen(true);
    } catch (error) {
      toast.error('Erro ao duplicar certificação');
    }
  };

  const handleCreateNewCourse = (courseData: { nome: string; cargaHoraria: string }) => {
    const dataToSend = {
      ...courseData,
      categoria: getCategoriaFromTab(activeTab),
      area: 'Geral',
      modalidade: newCertification.modalidade || 'EAD'
    };
    
    createCourseMutation.mutate(dataToSend, {
      onSuccess: (newCourse) => {
        setNewCertification({
          ...newCertification,
          curso: newCourse.nome,
          cargaHoraria: newCourse.cargaHoraria.toString()
        });
        setIsNewCourseDialogOpen(false);
        setNewCourseData({ nome: '', cargaHoraria: '' });
      }
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main ref={scrollParentRef} className="flex-1 overflow-auto">
          <div className="w-full p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-2xl font-bold">Análises Certificações</h1>
                  {isPreviousData && (
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full animate-pulse">
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                      <span>Atualizando</span>
                    </div>
                  )}
                  <p className="text-gray-600">Gerencie certificações e processos de documentação</p>
                </div>
              </div>
              
              {/* Botões de ação com tratamento de erro específico para problema do Erick */}
              <div className="flex items-center space-x-2">
                {certificationsError && (
                  <div className="flex items-center space-x-2 mr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('[CERTIFICAÇÕES] Recarregamento manual - Problema específico do usuário Erick Moreira');
                        refetch();
                        toast.info('Recarregando análises de certificação...');
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      🔄 Recarregar
                    </Button>
                    <div className="text-sm text-red-600">
                      Erro ao carregar dados
                    </div>
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex items-center text-sm text-gray-500 mr-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Carregando análises...
                  </div>
                )}
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Certificação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Certificação</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para criar uma nova certificação
                      </DialogDescription>
                    </DialogHeader>
                    <CertificationForm
                      mode="create"
                      defaultValues={newCertification}
                      preRegisteredCourses={preRegisteredCourses}
                      courseSearchOpen={courseSearchOpen}
                      onCourseSearchOpenChange={setCourseSearchOpen}
                      onSubmit={handleCreateCertification}
                      onCancel={() => setIsCreateDialogOpen(false)}
                      onFormChange={(data) => setNewCertification({
                        ...data,
                        cargaHoraria: typeof data.cargaHoraria === 'number' ? data.cargaHoraria.toString() : data.cargaHoraria
                      })}
                      onNewCourseClick={() => setIsNewCourseDialogOpen(true)}
                      isSubmitting={createMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CategoriaKey)} className="w-full">
              <TabsList aria-label="Categorias de certificação" className="flex flex-wrap gap-1 p-1 h-auto min-h-[48px] bg-gray-100 rounded-lg justify-start">
                {TABS_CONFIG.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`flex-1 ${tab.minW} px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm`}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 relative w-full">
                {/* Indicador de loading no canto superior direito */}
                {isFetching && !isInitialLoading && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border px-3 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-xs text-gray-600">Atualizando...</span>
                    </div>
                  </div>
                )}

                {/* Alerta de Duplicatas */}
                <DuplicateAlert duplicates={duplicates} />

                {/* Filtros */}
                <CertificationFilters
                  searchTerm={searchInput}
                  filterStatus={filterStatus}
                  filterTipoData={filterTipoData}
                  filterPeriodo={filterPeriodo}
                  dataInicio={dataInicio}
                  dataFim={dataFim}
                  onSearchChange={setSearchInput}
                  onStatusChange={(value) => setFilterStatus(value as Status | 'todos')}
                  onTipoDataChange={setFilterTipoData}
                  onPeriodoChange={setFilterPeriodo}
                  onDataInicioChange={setDataInicio}
                  onDataFimChange={setDataFim}
                />

                {/* Contador de Resultados e Controles de Tamanho de Página */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {isInitialLoading ? (
                      "Carregando..."
                    ) : (
                      <>
                        Exibindo <strong>{(currentPage - 1) * pageSize + 1}</strong> a <strong>{Math.min(currentPage * pageSize, totalCertifications)}</strong> de <strong>{totalCertifications}</strong> certificação{totalCertifications !== 1 ? 'ões' : ''} 
                        {searchTerm && ` para "${searchTerm}"`}
                        {filterStatus && filterStatus !== 'todos' && ` com status "${filterStatus}"`}
                        {isFetching && <span className="text-blue-600 ml-2">(atualizando...)</span>}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label htmlFor="page-size" className="text-sm">Mostrar:</label>
                    <select 
                      id="page-size"
                      value={pageSize.toString()} 
                      onChange={(e) => handlePageSizeChange(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>

                {/* Lista de certificações virtualizada */}
                <div className={certifications.length > 0 ? "min-h-[500px] w-full" : "min-h-[400px] w-full"}>
                  {isInitialLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : certifications.length === 0 ? (
                    <div className="w-full flex justify-center items-center min-h-[250px] px-4">
                      <Card className="w-full max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <div className="text-lg font-medium text-gray-900 mb-2">
                            {activeTab === 'eja' ? 'Categoria EJA não possui certificações' : 'Nenhuma certificação encontrada'}
                          </div>
                          <div className="text-gray-600 text-sm">
                            {activeTab === 'eja' 
                              ? 'Esta categoria está vazia. Verifique se os dados foram importados corretamente ou crie uma nova certificação EJA.'
                              : 'Crie uma nova certificação para começar'
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div
                      className="w-full"
                      style={{
                        height: '500px',
                      }}
                    >
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                          const certification = certifications[virtualItem.index];
                          
                          // Verificar se esta certificação está em algum grupo de duplicatas
                          const isDuplicate = Object.values(duplicates).some(group => 
                            group.some(cert => cert.id === certification.id)
                          );

                          return (
                            <div
                              key={virtualItem.key}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                                paddingBottom: '16px', // Espaçamento entre cards (space-y-4)
                              }}
                            >
                              <CertificationCard
                                certification={certification}
                                isDuplicate={isDuplicate}
                                onEdit={setSelectedCertification}
                                onDelete={handleDeleteCertification}
                                onDuplicate={handleDuplicateCertification}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Paginação inferior - só aparece quando há dados */}
                {!isInitialLoading && totalCertifications > 0 && (
                  <CertificationPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCertifications={totalCertifications}
                    pageSize={pageSize}
                    searchTerm={searchTerm}
                    filterStatus={filterStatus}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!selectedCertification} onOpenChange={() => setSelectedCertification(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Certificação</DialogTitle>
            <DialogDescription>
              Modifique os dados da certificação selecionada
            </DialogDescription>
          </DialogHeader>
          {selectedCertification && (
            <CertificationForm
              mode="edit"
              defaultValues={{
                id: selectedCertification.id,
                aluno: selectedCertification.aluno || '',
                cpf: selectedCertification.cpf || '',
                modalidade: selectedCertification.modalidade || '',
                curso: selectedCertification.curso || '',
                cargaHoraria: selectedCertification.cargaHoraria?.toString() || '',
                financeiro: selectedCertification.financeiro || 'em_dia',
                documentacao: selectedCertification.documentacao || 'pendente',
                plataforma: selectedCertification.plataforma || 'pendente',
                tutoria: selectedCertification.tutoria || '',
                observacao: selectedCertification.observacao || '',
                inicioCertificacao: selectedCertification.inicioCertificacao || '',
                dataPrevista: selectedCertification.dataPrevista || '',
                diploma: selectedCertification.diploma || '',
                status: selectedCertification.status || 'pendente',
                categoria: selectedCertification.categoria || '',
                tcc: selectedCertification.tcc || 'nao_possui',
                praticasPedagogicas: selectedCertification.praticasPedagogicas || 'nao_possui',
                estagio: selectedCertification.estagio || 'nao_possui'
              }}
              preRegisteredCourses={editPreRegisteredCourses}
              courseSearchOpen={editCourseSearchOpen}
              onCourseSearchOpenChange={setEditCourseSearchOpen}
              onSubmit={handleUpdateCertification}
              onCancel={() => setSelectedCertification(null)}
              onFormChange={(data) => {
                if (selectedCertification) {
                  setSelectedCertification({
                    ...selectedCertification,
                    ...data,
                    cargaHoraria: typeof data.cargaHoraria === 'string' ? parseInt(data.cargaHoraria) || 0 : data.cargaHoraria
                  });
                }
              }}
              onNewCourseClick={() => setIsNewCourseDialogOpen(true)}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para novo curso */}
      <NewCourseDialog
        isOpen={isNewCourseDialogOpen}
        onOpenChange={setIsNewCourseDialogOpen}
        onSubmit={handleCreateNewCourse}
        isSubmitting={createCourseMutation.isPending}
        modalidade={newCertification.modalidade}
      />

      {/* AlertDialog para confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta certificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}