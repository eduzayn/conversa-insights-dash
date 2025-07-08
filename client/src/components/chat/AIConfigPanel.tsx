
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

interface AIConfigPanelProps {
  onBack: () => void;
}

export const AIConfigPanel = ({ onBack }: AIConfigPanelProps) => {
  const [provider, setProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [perplexityKey, setPerplexityKey] = useState("");
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setTestStatus('testing');
    
    // Simulate API test
    setTimeout(() => {
      setTestStatus(Math.random() > 0.5 ? 'success' : 'error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">Configuração de IA</h3>
      </div>

      <div className="space-y-4 flex-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Provedor de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={provider} onValueChange={setProvider}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="openai" />
                <Label htmlFor="openai" className="text-sm">OpenAI (GPT-3.5)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="perplexity" id="perplexity" />
                <Label htmlFor="perplexity" className="text-sm">Perplexity AI</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chaves de API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="openai-key" className="text-xs">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="perplexity-key" className="text-xs">Perplexity API Key</Label>
              <Input
                id="perplexity-key"
                type="password"
                value={perplexityKey}
                onChange={(e) => setPerplexityKey(e.target.value)}
                placeholder="pplx-..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleTest}
          disabled={testStatus === 'testing'}
          className="w-full"
          variant={testStatus === 'success' ? 'default' : 'outline'}
        >
          {testStatus === 'testing' && 'Testando...'}
          {testStatus === 'success' && (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Conexão OK
            </>
          )}
          {testStatus === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Erro na conexão
            </>
          )}
          {testStatus === 'idle' && 'Testar Conexão'}
        </Button>
      </div>
    </div>
  );
};
