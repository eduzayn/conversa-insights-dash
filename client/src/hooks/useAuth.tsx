
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
  username?: string;
  companyAccount?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name: string, token: string, registrationData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("token");
    if (token && token.trim() && token !== 'undefined' && token !== 'null') {
      // Verificar se o token é válido apenas se não estiver vazio
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            // Token inválido ou expirado
            localStorage.removeItem("token");
            setUser(null);
            return;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.user) {
            setUser({
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              username: data.user.username,
              companyAccount: data.user.companyAccount,
              department: data.user.department
            });
          } else {
            localStorage.removeItem("token");
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Sem token ou token inválido
      if (token) {
        localStorage.removeItem("token");
      }
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      // Limpar tokens anteriores antes de tentar novo login
      localStorage.removeItem("token");
      localStorage.removeItem("student_token");
      localStorage.removeItem("professor_token");
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username: usernameOrEmail, 
          password 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro no login");
      }

      const data = await response.json();
      
      // Verificar se o token foi recebido corretamente
      if (!data.token || !data.user) {
        throw new Error("Dados de autenticação inválidos");
      }
      
      // Salvar token JWT
      localStorage.setItem("token", data.token);
      
      // Definir usuário no estado
      setUser({
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        username: data.user.username,
        companyAccount: data.user.companyAccount,
        department: data.user.department
      });
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, name: string, token: string, registrationData: any) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          name,
          token,
          ...registrationData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro no registro");
      }

      const data = await response.json();
      
      // Salvar token JWT
      localStorage.setItem("token", data.token);
      
      // Definir usuário no estado
      setUser({
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        username: data.user.username,
        companyAccount: data.user.companyAccount,
        department: data.user.department
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    // Limpar todos os dados de sessão
    localStorage.removeItem("student_token");
    localStorage.removeItem("professor_token");
    // Redirecionar para a página de login
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
