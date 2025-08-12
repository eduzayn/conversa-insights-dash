import { type Request, type Response, type NextFunction } from "express";

export function rbac(...allowed: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    try {
      const role = req?.user?.role;
      if (!role) return res.status(401).json({ message: "Não autenticado" });
      if (!allowed.includes(role)) return res.status(403).json({ message: "Acesso negado" });
      next();
    } catch {
      return res.status(401).json({ message: "Não autenticado" });
    }
  };
}