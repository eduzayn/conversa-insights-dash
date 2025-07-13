import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Atendimento } from "@/types/atendimento";

const atendimentoSchema = z.object({
  lead: z.string().min(1, "Nome do lead é obrigatório"),
  hora: z.string().min(1, "Hora é obrigatória"),
  atendente: z.string().min(1, "Atendente é obrigatório"),
  equipe: z.string().min(1, "Equipe é obrigatória"),
  duracao: z.string().min(1, "Duração é obrigatória"),
  status: z.enum(['Concluído', 'Em andamento', 'Pendente']),
  resultado: z.enum(['venda_ganha', 'venda_perdida', 'aluno_satisfeito', 'sem_solucao']).optional(),
  companhia: z.enum(['COMERCIAL', 'SUPORTE']).optional(),
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
      lead: atendimento?.lead || "",
      hora: atendimento?.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      atendente: atendimento?.atendente || "",
      equipe: atendimento?.equipe || "Atendimento",
      duracao: atendimento?.duracao || "00:30",
      status: atendimento?.status || 'Pendente',
      resultado: atendimento?.resultado || undefined,
      companhia: (atendimento?.companhia as 'COMERCIAL' | 'SUPORTE') || 'SUPORTE',
    }
  });

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {atendimento ? 'Edite as informações do atendimento' : 'Preencha os dados para criar um novo atendimento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
              <Label htmlFor="hora">Hora *</Label>
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
                  <SelectItem value="Atendimento">Atendimento</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                  <SelectItem value="Relacionamento">Relacionamento</SelectItem>
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
              </SelectContent>
            </Select>
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