
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigurarMetasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IndicadorOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const ConfigurarMetasModal = ({ open, onOpenChange }: ConfigurarMetasModalProps) => {
  const [tipoMeta, setTipoMeta] = useState("mensal");
  const [aplicacao, setAplicacao] = useState("equipe");
  const [equipe, setEquipe] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [indicador, setIndicador] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [moedas, setMoedas] = useState("");
  const [descricaoPremio, setDescricaoPremio] = useState("");

  const handleSalvar = () => {
    // Aqui seria implementada a lógica para salvar a meta
    // Salvando meta silenciosamente
    onOpenChange(false);
  };

  const getIndicadoresPorEquipe = (equipeSelecionada: string): IndicadorOption[] => {
    const indicadoresComerciais: IndicadorOption[] = [
      { value: "vendas-realizadas", label: "📈 Total de vendas realizadas" },
      { value: "faturamento", label: "💰 Faturamento gerado (R$)" },
      { value: "leads-atendidos", label: "📞 Leads atendidos" },
      { value: "taxa-conversao", label: "📊 Taxa de conversão (%)" },
      { value: "tempo-conversao", label: "⏱️ Tempo médio até a conversão (dias)" },
      { value: "vendas-recorrentes", label: "🧩 Vendas recorrentes (clientes antigos)" }
    ];

    const indicadoresSuporte: IndicadorOption[] = [
      { value: "atendimentos-concluidos", label: "🎧 Atendimentos concluídos" },
      { value: "problemas-resolvidos", label: "🧹 Problemas resolvidos" },
      { value: "problemas-evitados", label: "🚫 Problemas evitados (ações preventivas)" },
      { value: "tempo-resolucao", label: "⏳ Tempo médio de resolução" },
      { value: "satisfacao", label: "👍 Índice de satisfação do atendimento (%)" },
      { value: "sla-cumprido", label: "📅 SLA cumprido (atendimentos no prazo)" }
    ];

    const indicadoresAdministrativos: IndicadorOption[] = [
      { value: "processos-finalizados", label: "🧮 Processos finalizados" },
      { value: "valor-servicos", label: "💵 Valor gerado por serviços administrativos" },
      { value: "documentacoes", label: "📑 Documentações processadas" },
      { value: "solicitacoes", label: "📬 Solicitações atendidas" },
      { value: "tempo-processo", label: "🕓 Tempo médio por processo" }
    ];

    const indicadoresTransversais: IndicadorOption[] = [
      { value: "horas-atividade", label: "🕒 Horas de atividade efetiva na plataforma" },
      { value: "dias-presenca", label: "🔓 Dias com presença registrada" },
      { value: "moedas-acumuladas", label: "🪙 Moedas Zaynianas acumuladas" },
      { value: "metas-batidas", label: "🎯 Metas anteriores batidas" },
      { value: "engajamento", label: "🚀 Engajamento (% de dias com login e atividade)" }
    ];

    switch (equipeSelecionada) {
      case "comercial":
        return [
          ...indicadoresComerciais,
          { value: "separator-1", label: "--- Indicadores Gerais ---", disabled: true },
          ...indicadoresTransversais
        ];
      case "suporte":
        return [
          ...indicadoresSuporte,
          { value: "separator-1", label: "--- Indicadores Gerais ---", disabled: true },
          ...indicadoresTransversais
        ];
      case "administrativo":
        return [
          ...indicadoresAdministrativos,
          { value: "separator-1", label: "--- Indicadores Gerais ---", disabled: true },
          ...indicadoresTransversais
        ];
      default:
        // Caso não tenha equipe selecionada, mostrar todos os indicadores organizados
        return [
          { value: "separator-comercial", label: "--- Comerciais ---", disabled: true },
          ...indicadoresComerciais,
          { value: "separator-suporte", label: "--- Suporte ---", disabled: true },
          ...indicadoresSuporte,
          { value: "separator-admin", label: "--- Administrativos ---", disabled: true },
          ...indicadoresAdministrativos,
          { value: "separator-gerais", label: "--- Gerais ---", disabled: true },
          ...indicadoresTransversais
        ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Nova Meta</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
              <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
              <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo-meta">Tipo de Meta</Label>
                      <Select value={tipoMeta} onValueChange={setTipoMeta}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diaria">Diária</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aplicacao">Aplicação da Meta</Label>
                      <Select value={aplicacao} onValueChange={setAplicacao}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equipe">Para equipe inteira</SelectItem>
                          <SelectItem value="colaborador">Para colaborador específico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {aplicacao === "equipe" ? (
                    <div className="space-y-2">
                      <Label htmlFor="equipe">Selecionar Equipe/Setor</Label>
                      <Select value={equipe} onValueChange={setEquipe}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha a equipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="suporte">Suporte</SelectItem>
                          <SelectItem value="administrativo">Administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="colaborador">Selecionar Colaborador</Label>
                      <Select value={colaborador} onValueChange={setColaborador}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha o colaborador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maria-souza">Maria Souza</SelectItem>
                          <SelectItem value="joao-lima">João Lima</SelectItem>
                          <SelectItem value="ana-santos">Ana Santos</SelectItem>
                          <SelectItem value="carlos-silva">Carlos Silva</SelectItem>
                          <SelectItem value="bruna-reis">Bruna Reis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="indicadores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Indicadores e Valores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="indicador">Indicador</Label>
                    <Select value={indicador} onValueChange={setIndicador}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o indicador" />
                      </SelectTrigger>
                      <SelectContent>
                        {getIndicadoresPorEquipe(equipe).map((ind) => (
                          <SelectItem 
                            key={ind.value} 
                            value={ind.value}
                            disabled={ind.disabled}
                            className={ind.disabled ? "font-semibold text-gray-500 bg-gray-50" : ""}
                          >
                            {ind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor-meta">Valor da Meta</Label>
                    <Input
                      id="valor-meta"
                      placeholder="Ex: 50, 10000, 200"
                      value={valorMeta}
                      onChange={(e) => setValorMeta(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recompensas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recompensas e Prêmios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="moedas">Moedas Zaynianas</Label>
                    <Input
                      id="moedas"
                      placeholder="Quantidade de moedas ao atingir a meta"
                      value={moedas}
                      onChange={(e) => setMoedas(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao-premio">Descrição do Prêmio (Opcional)</Label>
                    <Textarea
                      id="descricao-premio"
                      placeholder="Descreva o prêmio ou reconhecimento adicional"
                      value={descricaoPremio}
                      onChange={(e) => setDescricaoPremio(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} className="bg-green-600 hover:bg-green-700">
              Salvar Meta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
