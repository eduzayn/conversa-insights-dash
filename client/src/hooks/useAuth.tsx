
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
  register: (username: string, email: string, password: string, name: string, token: string, companyAccount?: string, department?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("token");
    if (token) {
      // Verificar se o token é válido
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
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
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
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

  const register = async (username: string, email: string, password: string, name: string, token: string, companyAccount?: string, department?: string) => {
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
          companyAccount,
          department
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
