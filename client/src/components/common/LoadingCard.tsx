import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingCardProps {
  message?: string;
}

/**
 * Componente consolidado para estados de carregamento
 * Elimina duplicação de loading states entre páginas
 */
export function LoadingCard({ message = "Carregando..." }: LoadingCardProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
        <div className="text-gray-600">{message}</div>
      </CardContent>
    </Card>
  );
}