import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft } from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para o sistema de tokens após 3 segundos
    const timer = setTimeout(() => {
      navigate('/gerenciar-tokens');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Registro de Usuário</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              O registro de novos usuários é feito através do sistema de tokens de autocadastro.
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para o sistema de tokens...
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/gerenciar-tokens')}
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ir para Sistema de Tokens
            </Button>
            
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;