import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

/**
 * Componente consolidado para estados vazios
 * Elimina duplicação de empty states entre páginas
 */
export function EmptyStateCard({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  children 
}: EmptyStateCardProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />}
        <div className="text-lg font-medium text-gray-900 mb-2">{title}</div>
        {description && (
          <div className="text-gray-600 mb-4">{description}</div>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
}