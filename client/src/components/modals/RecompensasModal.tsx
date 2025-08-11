
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Utensils, Building, CreditCard, Gamepad2 } from "lucide-react";

interface RecompensasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecompensasModal = ({ open, onOpenChange }: RecompensasModalProps) => {
  const recompensas = [
    {
      id: 1,
      nome: "Jantar em Restaurante",
      descricao: "Vale para jantar em restaurantes parceiros",
      moedas: 250,
      categoria: "Gastronomia",
      icon: Utensils,
      disponivel: true
    },
    {
      id: 2,
      nome: "Diária em Hotel",
      descricao: "Uma diária completa em hotéis parceiros",
      moedas: 600,
      categoria: "Hospedagem",
      icon: Building,
      disponivel: true
    },
    {
      id: 3,
      nome: "Cartão Presente",
      descricao: "Vale-compras para lojas diversas",
      moedas: 300,
      categoria: "Compras",
      icon: CreditCard,
      disponivel: true
    },
    {
      id: 4,
      nome: "Experiência de Lazer",
      descricao: "Cinema, teatro, parques e eventos",
      moedas: 180,
      categoria: "Entretenimento",
      icon: Gamepad2,
      disponivel: true
    },
    {
      id: 5,
      nome: "Fim de Semana Especial",
      descricao: "Pacote completo para o fim de semana",
      moedas: 800,
      categoria: "Pacotes",
      icon: Gift,
      disponivel: false
    },
    {
      id: 6,
      nome: "Curso ou Workshop",
      descricao: "Investimento em desenvolvimento pessoal",
      moedas: 400,
      categoria: "Educação",
      icon: Gift,
      disponivel: true
    }
  ];

  const getCategoriaColor = (categoria: string) => {
    const colors = {
      "Gastronomia": "bg-orange-100 text-orange-800",
      "Hospedagem": "bg-blue-100 text-blue-800",
      "Compras": "bg-green-100 text-green-800",
      "Entretenimento": "bg-purple-100 text-purple-800",
      "Pacotes": "bg-red-100 text-red-800",
      "Educação": "bg-yellow-100 text-yellow-800"
    };
    return colors[categoria as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Catálogo de Recompensas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Troque suas moedas Zaynianas por recompensas incríveis! 
            Quanto mais você se dedica, mais prêmios pode conquistar.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recompensas.map((recompensa) => {
              const IconComponent = recompensa.icon;
              return (
                <Card key={recompensa.id} className={`relative ${!recompensa.disponivel ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{recompensa.nome}</CardTitle>
                          <Badge className={getCategoriaColor(recompensa.categoria)}>
                            {recompensa.categoria}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">🪙 {recompensa.moedas}</div>
                        {!recompensa.disponivel && (
                          <Badge variant="secondary">Indisponível</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{recompensa.descricao}</p>
                    <Button 
                      className="w-full" 
                      disabled={!recompensa.disponivel}
                      variant={recompensa.disponivel ? "default" : "secondary"}
                    >
                      {recompensa.disponivel ? "Resgatar Agora" : "Indisponível"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Como funciona?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Atinja suas metas para ganhar moedas Zaynianas</li>
              <li>• Acumule moedas ao longo do tempo</li>
              <li>• Troque por recompensas quando quiser</li>
              <li>• Novos prêmios são adicionados mensalmente</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
