import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Atendimento } from "@/types/atendimento";

// Função para obter data atual no fuso de São Paulo
const getCurrentDateSaoPaulo = () => {
  return new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-'); // Converte para formato YYYY-MM-DD
};

const atendimentoSchema = z.object({
  lead: z.string().min(1, "Nome do lead é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  atendente: z.string().min(1, "Atendente é obrigatório"),
  equipe: z.string().min(1, "Equipe é obrigatória"),
  duracao: z.string().min(1, "Duração é obrigatória"),
  status: z.enum(['Concluído', 'Em andamento', 'Pendente']),
  resultado: z.enum(['venda_ganha', 'venda_perdida', 'aluno_satisfeito', 'sem_solucao', 'resolvido']).optional(),
  assunto: z.string().min(1, "Assunto é obrigatório"),
  observacoes: z.string().optional(),
});

type AtendimentoFormData = z.infer<typeof atendimentoSchema>;

interface AtendimentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  atendimento?: Atendimento | null;
  onSubmit: (data: any) => void;
  title: string;
}

export const AtendimentoFormModal = ({
  isOpen,
  onClose,
  atendimento,
  onSubmit,
  title
}: AtendimentoFormModalProps) => {
  // Buscar lista de usuários
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      return response.json();
    }
  });

  const form = useForm<AtendimentoFormData>({
    resolver: zodResolver(atendimentoSchema),
    defaultValues: {
      lead: "",
      data: getCurrentDateSaoPaulo(),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      atendente: "",
      equipe: "Suporte",
      duracao: "00:30",
      status: 'Pendente',
      resultado: undefined,
      assunto: "",
    }
  });

  // Resetar o formulário quando o atendimento mudar
  useEffect(() => {
    if (atendimento) {
      form.reset({
        lead: atendimento.lead || "",
        data: atendimento.data || getCurrentDateSaoPaulo(),
        hora: atendimento.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        atendente: atendimento.atendente || "",
        equipe: atendimento.equipe || "Suporte",
        duracao: atendimento.duracao || "00:30",
        status: atendimento.status || 'Pendente',
        resultado: atendimento.resultado || undefined,
        assunto: atendimento.assunto || "",
        observacoes: atendimento.observacoes || "",
      });
    } else {
      form.reset({
        lead: "",
        data: getCurrentDateSaoPaulo(),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        atendente: "",
        equipe: "Suporte",
        duracao: "00:30",
        status: 'Pendente',
        resultado: undefined,
        assunto: "",
        observacoes: "",
      });
    }
  }, [atendimento, form]);

  const handleSubmit = (data: AtendimentoFormData) => {
    if (atendimento) {
      // Editar atendimento existente
      onSubmit({ id: atendimento.id, data });
    } else {
      // Criar novo atendimento
      onSubmit(data);
    }
    onClose();
    form.reset();
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {atendimento ? 'Edite as informações do atendimento' : 'Preencha os dados para criar um novo atendimento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="lead">Nome do Lead *</Label>
              <Input
                id="lead"
                {...form.register("lead")}
                placeholder="Nome do cliente/lead"
              />
              {form.formState.errors.lead && (
                <p className="text-sm text-red-600">{form.formState.errors.lead.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data e Hora *</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    id="data"
                    type="date"
                    {...form.register("data")}
                  />
                  {form.formState.errors.data && (
                    <p className="text-sm text-red-600">{form.formState.errors.data.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    id="hora"
                    type="time"
                    {...form.register("hora")}
                  />
                  {form.formState.errors.hora && (
                    <p className="text-sm text-red-600">{form.formState.errors.hora.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="atendente">Atendente *</Label>
              <Select
                value={form.watch("atendente")}
                onValueChange={(value) => form.setValue("atendente", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o atendente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.atendente && (
                <p className="text-sm text-red-600">{form.formState.errors.atendente.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipe">Equipe *</Label>
              <Select
                value={form.watch("equipe")}
                onValueChange={(value) => form.setValue("equipe", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suporte">Suporte</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Cobrança">Cobrança</SelectItem>
                  <SelectItem value="Tutoria">Tutoria</SelectItem>
                  <SelectItem value="Secretaria Pós">Secretaria Pós</SelectItem>
                  <SelectItem value="Secretaria Segunda">Secretaria Segunda</SelectItem>
                  <SelectItem value="Documentação">Documentação</SelectItem>
                  <SelectItem value="Análise Certificação">Análise Certificação</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.equipe && (
                <p className="text-sm text-red-600">{form.formState.errors.equipe.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração *</Label>
              <Input
                id="duracao"
                {...form.register("duracao")}
                placeholder="00:30"
              />
              {form.formState.errors.duracao && (
                <p className="text-sm text-red-600">{form.formState.errors.duracao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Select
                value={form.watch("assunto")}
                onValueChange={(value) => form.setValue("assunto", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Troca de Curso">Troca de Curso</SelectItem>
                  <SelectItem value="Certificação Pós">Certificação Pós</SelectItem>
                  <SelectItem value="Certificação Segunda">Certificação Segunda</SelectItem>
                  <SelectItem value="Diploma em Atraso">Diploma em Atraso</SelectItem>
                  <SelectItem value="Segunda Via de Boleto">Segunda Via de Boleto</SelectItem>
                  <SelectItem value="Declaração de Matrícula">Declaração de Matrícula</SelectItem>
                  <SelectItem value="Aproveitamento de Disciplina">Aproveitamento de Disciplina</SelectItem>
                  <SelectItem value="Desbloqueio Plataforma">Desbloqueio Plataforma</SelectItem>
                  <SelectItem value="Abertura de Chamado UNICV">Abertura de Chamado UNICV</SelectItem>
                  <SelectItem value="Suporte Plataforma">Suporte Plataforma</SelectItem>
                  <SelectItem value="TCC">TCC</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Praticas Pedagógicas">Praticas Pedagógicas</SelectItem>
                  <SelectItem value="Negociação">Negociação</SelectItem>
                  <SelectItem value="Extensão">Extensão</SelectItem>
                  <SelectItem value="Quitação">Quitação</SelectItem>
                  <SelectItem value="Emissão de Contratos">Emissão de Contratos</SelectItem>
                  <SelectItem value="Documentação">Documentação</SelectItem>
                  <SelectItem value="Reclamação">Reclamação</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.assunto && (
                <p className="text-sm text-red-600">{form.formState.errors.assunto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: 'Concluído' | 'Em andamento' | 'Pendente') => form.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="Em andamento">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Em andamento
                    </div>
                  </SelectItem>
                  <SelectItem value="Concluído">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Concluído
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-600">{form.formState.errors.status.message}</p>
              )}
            </div>


          </div>

          <div className="space-y-2">
            <Label htmlFor="resultado">Resultado CRM</Label>
            <Select
              value={form.watch("resultado") || "sem_resultado"}
              onValueChange={(value) => {
                if (value === "sem_resultado") {
                  form.setValue("resultado", undefined);
                } else {
                  form.setValue("resultado", value as any);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o resultado (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_resultado">Sem resultado</SelectItem>
                <SelectItem value="venda_ganha">Venda Ganha</SelectItem>
                <SelectItem value="venda_perdida">Venda Perdida</SelectItem>
                <SelectItem value="aluno_satisfeito">Aluno Satisfeito</SelectItem>
                <SelectItem value="sem_solucao">Sem Solução</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...form.register("observacoes")}
              placeholder="Digite observações importantes sobre este atendimento (opcional)"
              rows={3}
              className="resize-none"
            />
            {form.formState.errors.observacoes && (
              <p className="text-sm text-red-600">{form.formState.errors.observacoes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Salvando...' : (atendimento ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};