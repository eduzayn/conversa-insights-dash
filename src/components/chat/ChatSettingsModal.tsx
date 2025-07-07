
import { useState } from "react";
import { Settings, Bell, Volume, User, Mail, X, Play, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useChatSettings } from "@/contexts/ChatSettingsContext";
import { soundStyles } from "@/types/chatSettings";

interface ChatSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatSettingsModal = ({ open, onOpenChange }: ChatSettingsModalProps) => {
  const { settings, updateSettings, resetToDefaults } = useChatSettings();
  const [activeTab, setActiveTab] = useState("visual");

  const playSoundPreview = (soundStyle: string) => {
    // Aqui você pode implementar a reprodução dos sons
    console.log(`Playing preview for: ${soundStyle}`);
  };

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Chat
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visual" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-1">
              <Volume className="h-4 w-4" />
              <span className="hidden sm:inline">Áudio</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Privacidade</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">E-mail</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[50vh]">
            <TabsContent value="visual" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  🔔 Notificações Visuais
                </h3>
                
                <SettingRow label="Mostrar balão de notificação na tela">
                  <Switch
                    checked={settings.showNotificationBalloon}
                    onCheckedChange={(checked) => updateSettings({ showNotificationBalloon: checked })}
                  />
                </SettingRow>

                <SettingRow label="Destacar canal com mensagens não lidas">
                  <Switch
                    checked={settings.highlightUnreadChannels}
                    onCheckedChange={(checked) => updateSettings({ highlightUnreadChannels: checked })}
                  />
                </SettingRow>

                <SettingRow label="Mostrar selo 'Novo!' em mensagens fixadas">
                  <Switch
                    checked={settings.showNewBadgeOnPinned}
                    onCheckedChange={(checked) => updateSettings({ showNewBadgeOnPinned: checked })}
                  />
                </SettingRow>

                <SettingRow label="Mostrar número de mensagens não lidas">
                  <Switch
                    checked={settings.showUnreadCount}
                    onCheckedChange={(checked) => updateSettings({ showUnreadCount: checked })}
                  />
                </SettingRow>

                <SettingRow label="Ativar alerta de menção direta (@Você)">
                  <Switch
                    checked={settings.enableMentionAlert}
                    onCheckedChange={(checked) => updateSettings({ enableMentionAlert: checked })}
                  />
                </SettingRow>

                <SettingRow 
                  label="Reproduzir animação leve (brilho, shake)"
                  description="Animação sutil quando receber mensagens"
                >
                  <Switch
                    checked={settings.enableLightAnimation}
                    onCheckedChange={(checked) => updateSettings({ enableLightAnimation: checked })}
                  />
                </SettingRow>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  🔊 Notificações de Áudio
                </h3>

                <SettingRow 
                  label="Som ao receber nova mensagem"
                  description="Reproduz um som leve (ping suave)"
                >
                  <Switch
                    checked={settings.playSoundOnNewMessage}
                    onCheckedChange={(checked) => updateSettings({ playSoundOnNewMessage: checked })}
                  />
                </SettingRow>

                <SettingRow 
                  label="Som ao receber menção com @"
                  description="Som mais marcante porém breve"
                >
                  <Switch
                    checked={settings.playSoundOnMention}
                    onCheckedChange={(checked) => updateSettings({ playSoundOnMention: checked })}
                  />
                </SettingRow>

                <SettingRow 
                  label="Som de novo áudio recebido"
                  description="'Blup' curto e suave"
                >
                  <Switch
                    checked={settings.playSoundOnNewAudio}
                    onCheckedChange={(checked) => updateSettings({ playSoundOnNewAudio: checked })}
                  />
                </SettingRow>

                <SettingRow 
                  label="Tocar som apenas se aba estiver em segundo plano"
                  description="Evita ruído desnecessário"
                >
                  <Switch
                    checked={settings.playSoundOnlyInBackground}
                    onCheckedChange={(checked) => updateSettings({ playSoundOnlyInBackground: checked })}
                  />
                </SettingRow>

                <Separator />

                <SettingRow label="Volume das notificações">
                  <div className="flex items-center gap-3 w-48">
                    <Slider
                      value={[settings.notificationVolume]}
                      onValueChange={([value]) => updateSettings({ notificationVolume: value })}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{settings.notificationVolume}%</span>
                  </div>
                </SettingRow>

                <SettingRow label="Escolher estilo de som">
                  <div className="flex items-center gap-2">
                    <Select
                      value={settings.soundStyle}
                      onValueChange={(value) => updateSettings({ soundStyle: value as any })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playSoundPreview(settings.soundStyle)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </SettingRow>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  👤 Privacidade e Comportamento
                </h3>

                <SettingRow label="Entrar automaticamente nos canais das equipes">
                  <Switch
                    checked={settings.autoJoinTeamChannels}
                    onCheckedChange={(checked) => updateSettings({ autoJoinTeamChannels: checked })}
                  />
                </SettingRow>

                <SettingRow label="Aparecer como 'online' ao abrir o sistema">
                  <Switch
                    checked={settings.showOnlineOnOpen}
                    onCheckedChange={(checked) => updateSettings({ showOnlineOnOpen: checked })}
                  />
                </SettingRow>

                <SettingRow label="Ocultar horário da última visualização">
                  <Switch
                    checked={settings.hideLastSeen}
                    onCheckedChange={(checked) => updateSettings({ hideLastSeen: checked })}
                  />
                </SettingRow>

                <SettingRow label="Notificar administrador ao alterar equipe">
                  <Switch
                    checked={settings.notifyAdminOnTeamChange}
                    onCheckedChange={(checked) => updateSettings({ notifyAdminOnTeamChange: checked })}
                  />
                </SettingRow>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  📬 Resumos e Notificações por E-mail
                </h3>

                <SettingRow label="Receber resumo diário de conversas">
                  <Switch
                    checked={settings.receiveDailySummary}
                    onCheckedChange={(checked) => updateSettings({ receiveDailySummary: checked })}
                  />
                </SettingRow>

                <SettingRow label="Receber e-mail ao ser mencionado com @">
                  <Switch
                    checked={settings.receiveEmailOnMention}
                    onCheckedChange={(checked) => updateSettings({ receiveEmailOnMention: checked })}
                  />
                </SettingRow>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrões
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
