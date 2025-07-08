
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "agent";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock authentication - replace with real API call
    if (email === "admin@educhat.com" && password === "admin123") {
      const user = {
        id: "1",
        email: "admin@educhat.com",
        name: "Administrador",
        role: "admin" as const
      };
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
    } else if (email === "atendente@educhat.com" && password === "agent123") {
      const user = {
        id: "2",
        email: "atendente@educhat.com",
        name: "João Silva",
        role: "agent" as const
      };
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      // Check for registered users in localStorage
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const foundUser = registeredUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const user = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role
        };
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        throw new Error("Invalid credentials");
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // Check if user already exists
    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const existingUser = registeredUsers.find((u: any) => u.email === email);
    
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: "agent" as const
    };

    // Save to registered users
    registeredUsers.push(newUser);
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));

    // Auto login after registration
    const user = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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
