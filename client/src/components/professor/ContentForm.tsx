import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { SubjectContent, Subject } from "@/types/professor";

const contentFormSchema = z.object({
  subjectId: z.number({ required_error: "Disciplina é obrigatória" }),
  titulo: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  tipo: z.enum(["video", "ebook", "link", "pdf"], { required_error: "Tipo é obrigatório" }),
  conteudo: z.string().url("URL deve ser válida").min(1, "URL é obrigatória"),
  descricao: z.string().optional(),
});

type ContentFormData = z.infer<typeof contentFormSchema>;

interface ContentFormProps {
  subjects: Subject[];
  initialData?: SubjectContent;
  onSuccess: () => void;
  onCancel: () => void;
  isModal?: boolean;
}

export default function ContentForm({ subjects, initialData, onSuccess, onCancel, isModal = false }: ContentFormProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      subjectId: initialData?.subjectId || undefined,
      titulo: initialData?.titulo || "",
      tipo: initialData?.tipo || undefined,
      conteudo: initialData?.conteudo || "",
      descricao: initialData?.descricao || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      const response = await fetch('/api/professor/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar conteúdo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor', 'contents'] });
      toast({
        title: "Sucesso",
        description: "Conteúdo criado com sucesso.",
      });
      onSuccess();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar conteúdo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      const response = await fetch(`/api/professor/contents/${initialData!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar conteúdo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor', 'contents'] });
      toast({
        title: "Sucesso",
        description: "Conteúdo atualizado com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar conteúdo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContentFormData) => {
    if (initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getPlaceholderByType = (type: string) => {
    switch (type) {
      case 'video':
        return 'https://www.youtube.com/watch?v=... ou https://drive.google.com/...';
      case 'ebook':
        return 'https://drive.google.com/... ou https://onedrive.live.com/...';
      case 'link':
        return 'https://exemplo.com/recurso-educacional';
      case 'pdf':
        return 'https://exemplo.com/arquivo.pdf';
      default:
        return 'URL do conteúdo';
    }
  };

  const validateUrlByType = (url: string, type: string) => {
    try {
      new URL(url); // Validação básica de URL
      
      switch (type) {
        case 'video':
          return url.includes('youtube.com') || url.includes('youtu.be') || 
                 url.includes('vimeo.com') || url.includes('drive.google.com');
        case 'ebook':
          return url.includes('drive.google.com') || url.includes('onedrive.live.com') ||
                 url.includes('.pdf') || url.includes('dropbox.com');
        case 'pdf':
          return url.includes('.pdf') || url.includes('drive.google.com') ||
                 url.includes('dropbox.com');
        case 'link':
          return true; // Qualquer URL válida
        default:
          return true;
      }
    } catch {
      return false;
    }
  };

  const getTypeValidationMessage = (type: string) => {
    switch (type) {
      case 'video':
        return 'URL deve ser do YouTube, Vimeo ou Google Drive';
      case 'ebook':
        return 'URL deve ser de arquivo PDF ou link do Google Drive/OneDrive';
      case 'pdf':
        return 'URL deve ser de arquivo PDF';
      case 'link':
        return 'URL deve ser válida';
      default:
        return 'URL deve ser válida';
    }
  };

  useEffect(() => {
    const subscription = form.watch((value: any, { name }: { name?: string }) => {
      if (name === 'tipo') {
        setSelectedType(value.tipo || '');
        // Limpar campo de conteúdo quando mudar tipo
        form.setValue('conteudo', '');
      }
      
      if (name === 'conteudo' && value.conteudo && value.tipo) {
        const isValid = validateUrlByType(value.conteudo, value.tipo);
        if (!isValid) {
          form.setError('conteudo', {
            type: 'manual',
            message: getTypeValidationMessage(value.tipo),
          });
        } else {
          form.clearErrors('conteudo');
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const FormContent = () => {
    console.log('ContentForm subjects:', subjects, 'length:', subjects.length); // Debug
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplina *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.length > 0 ? (
                        subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.nome}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Carregando disciplinas...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conteúdo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">Vídeo-aula</SelectItem>
                      <SelectItem value="ebook">E-book</SelectItem>
                      <SelectItem value="link">Link Útil</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o título do conteúdo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conteudo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL/Conteúdo *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={getPlaceholderByType(selectedType)}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descrição opcional do conteúdo"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {createMutation.isPending || updateMutation.isPending
                ? initialData ? "Atualizando..." : "Criando..."
                : initialData ? "Atualizar Conteúdo" : "Criar Conteúdo"
              }
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  if (isModal && initialData) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FormContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <FormContent />;
}