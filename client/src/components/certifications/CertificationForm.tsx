/**
 * Formulário unificado para criar e editar certificações
 * 
 * Usa mode: 'create' | 'edit' e defaultValues para reutilizar o mesmo componente
 * para as duas operações, mantendo toda a lógica de campos e validações
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceTranscription } from '@/components/common/VoiceTranscription';
import type { Certification } from '@shared/schema';

interface CertificationFormData {
  id?: number;
  aluno: string;
  cpf: string;
  modalidade: string;
  curso: string;
  cargaHoraria: string | number;
  financeiro: string;
  documentacao: string;
  plataforma: string;
  tutoria: string;
  observacao: string;
  inicioCertificacao: string;
  dataPrevista: string;
  diploma: string;
  status: string;
  categoria: string;
  tcc: string;
  praticasPedagogicas: string;
  estagio: string;
}

interface CertificationFormProps {
  mode: 'create' | 'edit';
  defaultValues: CertificationFormData;
  preRegisteredCourses: any[];
  courseSearchOpen: boolean;
  onCourseSearchOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificationFormData) => void;
  onCancel: () => void;
  onFormChange: (data: CertificationFormData) => void;
  onNewCourseClick: () => void;
  isSubmitting: boolean;
}

export const CertificationForm = ({
  mode,
  defaultValues,
  preRegisteredCourses,
  courseSearchOpen,
  onCourseSearchOpenChange,
  onSubmit,
  onCancel,
  onFormChange,
  onNewCourseClick,
  isSubmitting
}: CertificationFormProps) => {
  const [formData, setFormData] = useState<CertificationFormData>(defaultValues);

  const updateFormData = (updates: Partial<CertificationFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onFormChange(newData);
  };

  const handleSubmit = () => {
    // Converter cargaHoraria para número antes de enviar
    const dataToSubmit = {
      ...formData,
      cargaHoraria: typeof formData.cargaHoraria === 'string' && formData.cargaHoraria.trim() !== '' 
        ? parseInt(formData.cargaHoraria) || 0 
        : formData.cargaHoraria
    };
    onSubmit(dataToSubmit);
  };

  return (
    <>
      {/* Campo de Status em destaque no topo */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Label htmlFor="status" className="text-lg font-semibold text-blue-800">Status da Certificação</Label>
        <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value })}>
          <SelectTrigger className="mt-2 h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Pendente
              </div>
            </SelectItem>
            <SelectItem value="em_andamento">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Em Andamento
              </div>
            </SelectItem>
            <SelectItem value="concluido">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Concluído
              </div>
            </SelectItem>
            <SelectItem value="cancelado">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Cancelado
              </div>
            </SelectItem>
            <SelectItem value="em_atraso">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                Em Atraso
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Grid principal com todos os campos */}
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Label htmlFor="aluno">Aluno *</Label>
          <Input
            id="aluno"
            value={formData.aluno}
            onChange={(e) => updateFormData({ aluno: e.target.value })}
            placeholder="Nome do aluno"
          />
        </div>
        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => updateFormData({ cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <Label htmlFor="modalidade">Formato de Entrega</Label>
          <Select value={formData.modalidade} onValueChange={(value) => updateFormData({ modalidade: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Presencial">Presencial</SelectItem>
              <SelectItem value="EAD">EAD (Ensino a Distância)</SelectItem>
              <SelectItem value="Híbrido">Híbrido (Presencial + EAD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Campo de curso com busca */}
        <div className="col-span-2">
          <Label htmlFor="curso">Curso *</Label>
          <div className="flex gap-2">
            <Popover open={courseSearchOpen} onOpenChange={onCourseSearchOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={courseSearchOpen}
                  className="flex-1 justify-between text-left"
                >
                  <span className="truncate">{formData.curso || "Selecione um curso..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar curso..." />
                  <CommandList className="max-h-60">
                    <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                    <CommandGroup>
                      {preRegisteredCourses.map((course) => (
                        <CommandItem
                          key={course.id}
                          value={course.nome}
                          onSelect={(currentValue) => {
                            const selectedCourse = preRegisteredCourses.find(c => c.nome === currentValue);
                            updateFormData({ 
                              curso: currentValue,
                              cargaHoraria: selectedCourse ? selectedCourse.cargaHoraria.toString() : ''
                            });
                            onCourseSearchOpenChange(false);
                          }}
                          className="text-sm"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              formData.curso === course.nome ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{course.nome}</span>
                            <span className="text-xs text-gray-500">{course.cargaHoraria}h - {course.area}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={onNewCourseClick}
              title="Adicionar novo curso"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="cargaHoraria">Carga Horária</Label>
          <Input
            id="cargaHoraria"
            type="number"
            value={formData.cargaHoraria}
            onChange={(e) => updateFormData({ cargaHoraria: e.target.value })}
            placeholder="Horas"
            disabled={!!formData.curso}
          />
        </div>
        
        <div>
          <Label htmlFor="categoria">Categoria *</Label>
          <Select value={formData.categoria} onValueChange={(value) => updateFormData({ categoria: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
              <SelectItem value="segunda_licenciatura">Segunda Licenciatura</SelectItem>
              <SelectItem value="formacao_pedagogica">Formação Pedagógica</SelectItem>
              <SelectItem value="formacao_livre">Formação Livre</SelectItem>
              <SelectItem value="diplomacao_competencia">Diplomação por Competência</SelectItem>
              <SelectItem value="eja">EJA</SelectItem>
              <SelectItem value="graduacao">Graduação</SelectItem>
              <SelectItem value="capacitacao">Capacitação</SelectItem>
              <SelectItem value="sequencial">Sequencial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Campos de data */}
        <div>
          <Label htmlFor="inicioCertificacao">Data Início Certificação</Label>
          <Input
            id="inicioCertificacao"
            type="date"
            value={formData.inicioCertificacao}
            onChange={(e) => updateFormData({ inicioCertificacao: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="dataPrevista">Data Prevista de Entrega</Label>
          <Input
            id="dataPrevista"
            type="date"
            value={formData.dataPrevista}
            onChange={(e) => updateFormData({ dataPrevista: e.target.value })}
          />
        </div>



        {/* Status acadêmicos */}
        <div>
          <Label htmlFor="documentacao">Documentação</Label>
          <Select value={formData.documentacao} onValueChange={(value) => updateFormData({ documentacao: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status da Documentação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Pendente
                </div>
              </SelectItem>
              <SelectItem value="aprovada">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Aprovada
                </div>
              </SelectItem>
              <SelectItem value="reprovada">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Reprovada
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="plataforma">Atividades Plataforma</Label>
          <Select value={formData.plataforma} onValueChange={(value) => updateFormData({ plataforma: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status das Atividades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Pendente
                </div>
              </SelectItem>
              <SelectItem value="aprovada">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Aprovada
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="financeiro">Financeiro</Label>
          <Select value={formData.financeiro} onValueChange={(value) => updateFormData({ financeiro: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status Financeiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="em_dia">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  PENDENTE
                </div>
              </SelectItem>
              <SelectItem value="quitado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Quitado
                </div>
              </SelectItem>
              <SelectItem value="inadimplente">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Inadimplente
                </div>
              </SelectItem>
              <SelectItem value="expirado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  Expirado
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos acadêmicos específicos */}
        <div>
          <Label htmlFor="tcc">TCC</Label>
          <Select value={formData.tcc} onValueChange={(value) => updateFormData({ tcc: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status do TCC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao_possui">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
                  Não Possui
                </div>
              </SelectItem>
              <SelectItem value="aprovado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-700 rounded-full mr-2"></div>
                  Aprovado
                </div>
              </SelectItem>
              <SelectItem value="reprovado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Reprovado
                </div>
              </SelectItem>
              <SelectItem value="em_correcao">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Em Correção
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="praticasPedagogicas">Práticas Pedagógicas</Label>
          <Select value={formData.praticasPedagogicas} onValueChange={(value) => updateFormData({ praticasPedagogicas: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status das Práticas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao_possui">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
                  Não Possui
                </div>
              </SelectItem>
              <SelectItem value="aprovado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-700 rounded-full mr-2"></div>
                  Aprovado
                </div>
              </SelectItem>
              <SelectItem value="reprovado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Reprovado
                </div>
              </SelectItem>
              <SelectItem value="em_correcao">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Em Correção
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="estagio">Estágio</Label>
          <Select value={formData.estagio} onValueChange={(value) => updateFormData({ estagio: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status do Estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao_possui">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
                  Não Possui
                </div>
              </SelectItem>
              <SelectItem value="aprovado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-700 rounded-full mr-2"></div>
                  Aprovado
                </div>
              </SelectItem>
              <SelectItem value="reprovado">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Reprovado
                </div>
              </SelectItem>
              <SelectItem value="em_correcao">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Em Correção
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campo de observação com transcrição de voz */}
        <div className="col-span-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="observacao">Observação</Label>
            <VoiceTranscription
              onTranscript={(transcript) => {
                const currentValue = formData.observacao || '';
                const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
                updateFormData({ observacao: newValue });
              }}
            />
          </div>
          <Textarea
            id="observacao"
            value={formData.observacao}
            onChange={(e) => updateFormData({ observacao: e.target.value })}
            placeholder="Observações adicionais"
          />
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting} 
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (mode === 'create' ? 'Criando...' : 'Salvando...') : (mode === 'create' ? 'Criar' : 'Salvar')}
        </Button>
      </div>
    </>
  );
};