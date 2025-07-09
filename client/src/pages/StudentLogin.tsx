import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Calendar, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const studentLoginSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(14, "CPF inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória")
});

type StudentLoginForm = z.infer<typeof studentLoginSchema>;

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");

  const form = useForm<StudentLoginForm>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      cpf: "",
      dataNascimento: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: StudentLoginForm) => {
      const response = await apiRequest('/api/auth/student-login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro no login');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Salvar token no localStorage
      localStorage.setItem('student_token', data.token);
      localStorage.setItem('student_data', JSON.stringify(data.student));
      
      // Redirecionar para o portal do aluno
      setLocation('/portal-aluno');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const onSubmit = (data: StudentLoginForm) => {
    setError("");
    // Remover formatação do CPF antes de enviar
    const cleanData = {
      ...data,
      cpf: data.cpf.replace(/\D/g, '') // Remove pontos e traços
    };
    loginMutation.mutate(cleanData);
  };

  const formatCPF = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara do CPF
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Portal do Aluno</h1>
          <p className="text-gray-600 mt-2">Acesse sua área de estudos</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Entre com seus dados</CardTitle>
            <CardDescription className="text-center">
              Utilize seu CPF e data de nascimento para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        CPF
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data de Nascimento
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar no Portal"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Problemas para acessar?</p>
              <p className="mt-1">
                Entre em contato com a secretaria acadêmica
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Link para área administrativa */}
        <div className="text-center">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm">
            Área Administrativa
          </Link>
        </div>
      </div>
    </div>
  );
}