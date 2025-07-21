import { toast } from '@/hooks/use-toast';

/**
 * Hook consolidado para validações de formulário
 * Elimina duplicação de lógica de validação entre páginas
 */
export function useFormValidation() {
  
  const validateRequired = (value: any, fieldName: string): boolean => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      toast({
        title: "Campo obrigatório",
        description: `${fieldName} é obrigatório`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateCPF = (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "CPF deve ter 11 dígitos",
        variant: "destructive"
      });
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      toast({
        title: "CPF inválido",
        description: "CPF não pode ter todos os dígitos iguais",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({
        title: "Telefone inválido",
        description: "Telefone deve ter 10 ou 11 dígitos",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateDate = (date: string, fieldName: string = "Data"): boolean => {
    if (!date) {
      toast({
        title: "Campo obrigatório",
        description: `${fieldName} é obrigatória`,
        variant: "destructive"
      });
      return false;
    }

    const inputDate = new Date(date + 'T00:00:00');
    if (isNaN(inputDate.getTime())) {
      toast({
        title: "Data inválida",
        description: `Por favor, insira uma data válida para ${fieldName.toLowerCase()}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateFutureDate = (date: string, fieldName: string = "Data"): boolean => {
    if (!validateDate(date, fieldName)) return false;

    const inputDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      toast({
        title: "Data inválida",
        description: `${fieldName} não pode ser anterior à data atual`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateNumber = (value: any, fieldName: string, min?: number, max?: number): boolean => {
    const num = Number(value);
    if (isNaN(num)) {
      toast({
        title: "Valor inválido",
        description: `${fieldName} deve ser um número válido`,
        variant: "destructive"
      });
      return false;
    }

    if (min !== undefined && num < min) {
      toast({
        title: "Valor inválido",
        description: `${fieldName} deve ser maior ou igual a ${min}`,
        variant: "destructive"
      });
      return false;
    }

    if (max !== undefined && num > max) {
      toast({
        title: "Valor inválido",
        description: `${fieldName} deve ser menor ou igual a ${max}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return {
    validateRequired,
    validateEmail,
    validateCPF,
    validatePhone,
    validateDate,
    validateFutureDate,
    validateNumber
  };
}