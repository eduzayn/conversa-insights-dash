import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BarChart3, Eye, EyeOff, Users, Building, Network, CheckSquare } from "lucide-react";
import { COMPANIES, getDepartmentsByCompany } from "@shared/company-config";

const Login = () => {
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyAccount, setCompanyAccount] = useState("");
  const [department, setDepartment] = useState("");
  const [accessType, setAccessType] = useState("single"); // "single" ou "multi"
  const [multiCompanyData, setMultiCompanyData] = useState({
    COMERCIAL: { active: false, departments: [] as string[] },
    SUPORTE: { active: false, departments: [] as string[] }
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { user, login, register } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  // Funções auxiliares para multi-company access
  const handleCompanyToggle = (companyId: 'COMERCIAL' | 'SUPORTE', checked: boolean) => {
    setMultiCompanyData(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        active: checked,
        departments: checked ? (prev[companyId]?.departments || []) : []
      }
    }));
  };

  const handleDepartmentToggle = (companyId: 'COMERCIAL' | 'SUPORTE', departmentId: string, checked: boolean) => {
    setMultiCompanyData(prev => {
      const currentDepartments = prev[companyId]?.departments || [];
      return {
        ...prev,
        [companyId]: {
          ...prev[companyId],
          departments: checked 
            ? [...currentDepartments, departmentId]
            : currentDepartments.filter(d => d !== departmentId)
        }
      };
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(username, password);
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiplas submissões
    if (loading) return;
    
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem.");
        return;
      }

      if (password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (!token) {
        toast.error("Token de registro é obrigatório.");
        return;
      }

      // Validações específicas por tipo de acesso
      if (accessType === "single") {
        if (!companyAccount) {
          toast.error("Por favor, selecione uma companhia.");
          return;
        }

        if (!department) {
          toast.error("Por favor, selecione um departamento.");
          return;
        }
      } else {
        // Validação para acesso multi-companhia
        const hasActiveCompany = multiCompanyData.COMERCIAL?.active || multiCompanyData.SUPORTE?.active;
        if (!hasActiveCompany) {
          toast.error("Por favor, ative pelo menos uma companhia.");
          return;
        }

        // Validar se cada companhia ativa tem pelo menos um departamento selecionado
        const activeCompanies = Object.entries(multiCompanyData).filter(([_, data]) => data && data.active);
        for (const [companyId, data] of activeCompanies) {
          if (!data.departments || data.departments.length === 0) {
            toast.error(`Por favor, selecione pelo menos um departamento para ${companyId}.`);
            return;
          }
        }
      }
      
      // Preparar dados para envio
      const registrationData = accessType === "single" 
        ? { companyAccount, department, multiCompanyAccess: null }
        : { companyAccount: null, department: null, multiCompanyAccess: multiCompanyData };
      
      await register(username, email, password, name, token, registrationData);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className={`w-full ${activeTab === 'login' ? 'max-w-md' : 'max-w-4xl'} transition-all duration-300`}>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">ERP EdunexIA</CardTitle>
            <p className="text-gray-600 mt-1">Grupo Zayn Educacional</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seu.username"
                    required
                  />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                {/* Credenciais de teste - apenas desenvolvimento */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-2">✅ Credenciais de Teste (Desenvolvimento)</p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <p><strong>Username:</strong> admin</p>
                    <p><strong>Senha:</strong> password</p>
                    <p><strong>Função:</strong> Administrador</p>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6">
                {/* Campos básicos em duas colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome Completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="seu.username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-token">Token de Registro</Label>
                    <Input
                      id="register-token"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="demo-register-token-2025"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme sua senha"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  Use: demo-register-token-2025
                </div>
                
                {/* Tipo de Acesso */}
                <div className="space-y-2">
                  <Label htmlFor="access-type">Tipo de Acesso *</Label>
                  <Select value={accessType} onValueChange={(value) => {
                    setAccessType(value);
                    // Reset dados quando mudar o tipo
                    setCompanyAccount("");
                    setDepartment("");
                    setMultiCompanyData({
                      COMERCIAL: { active: false, departments: [] },
                      SUPORTE: { active: false, departments: [] }
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de acesso">
                        {accessType && (
                          <div className="flex items-center gap-2">
                            {accessType === "single" ? <Building className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                            {accessType === "single" ? "Acesso Único" : "Acesso Multi-Companhias"}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Acesso Único
                        </div>
                      </SelectItem>
                      <SelectItem value="multi">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          Acesso Multi-Companhias
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {accessType === "single" 
                      ? "Trabalhar em apenas uma companhia" 
                      : "Trabalhar em múltiplas companhias simultaneamente"
                    }
                  </p>
                </div>

                {/* Acesso Único */}
                {accessType === "single" && (
                  <div key="single-access" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="company-account">Companhia *</Label>
                      <Select value={companyAccount} onValueChange={(value) => {
                    setCompanyAccount(value);
                    setDepartment(""); // Reset department when company changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma companhia">
                        {companyAccount && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {COMPANIES.find(c => c.id === companyAccount)?.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANIES.filter(company => company && company.id).map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {company.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Selecione a companhia onde irá trabalhar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento / Funil *</Label>
                  <Select 
                    value={department} 
                    onValueChange={setDepartment}
                    disabled={!companyAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !companyAccount 
                          ? "Selecione primeiro uma companhia" 
                          : getDepartmentsByCompany(companyAccount).length === 0
                            ? "Nenhum departamento disponível para esta companhia. Contate o administrador."
                            : "Selecione um departamento"
                      }>
                        {department && companyAccount && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {getDepartmentsByCompany(companyAccount).find(d => d.id === department)?.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {getDepartmentsByCompany(companyAccount).filter(dept => dept && dept.id).map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {dept.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Selecione o departamento/funil onde irá atuar
                  </p>
                </div>
                  </div>
                )}

                {/* Acesso Multi-Companhias */}
                {accessType === "multi" && (
                  <div key="multi-access" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Configuração Multi-Companhias
                      </h4>
                      <p className="text-sm text-blue-700">
                        Selecione as companhias e departamentos onde você irá trabalhar
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COMPANIES.filter(company => company && company.id).map(company => (
                        <div key={`multi-${company.id}`} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`company-${company.id}`}
                              checked={multiCompanyData[company.id as 'COMERCIAL' | 'SUPORTE']?.active || false}
                              onCheckedChange={(checked) => 
                                handleCompanyToggle(company.id as 'COMERCIAL' | 'SUPORTE', checked as boolean)
                              }
                            />
                            <Label htmlFor={`company-${company.id}`} className="font-medium flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {company.name}
                            </Label>
                          </div>
                          
                          {multiCompanyData[company.id as 'COMERCIAL' | 'SUPORTE']?.active && (
                            <div className="ml-6 space-y-2">
                              <Label className="text-sm text-gray-600">Departamentos:</Label>
                              <div className="grid grid-cols-1 gap-2">
                                {company.departments.filter(dept => dept && dept.id).map(dept => (
                                  <div key={`dept-${company.id}-${dept.id}`} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`dept-${company.id}-${dept.id}`}
                                      checked={multiCompanyData[company.id as 'COMERCIAL' | 'SUPORTE']?.departments.includes(dept.id) || false}
                                      onCheckedChange={(checked) =>
                                        handleDepartmentToggle(company.id as 'COMERCIAL' | 'SUPORTE', dept.id, checked as boolean)
                                      }
                                    />
                                    <Label htmlFor={`dept-${company.id}-${dept.id}`} className="text-sm flex items-center gap-2">
                                      <Users className="h-3 w-3" />
                                      {dept.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
                  disabled={loading}
                >
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
