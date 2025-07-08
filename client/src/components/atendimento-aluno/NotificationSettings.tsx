
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/hooks/useNotifications";
import { Settings, Volume2 } from "lucide-react";

export const NotificationSettings = () => {
  const { settings, updateSettings, playNotificationSound } = useNotifications();

  const handleTestSound = (soundType: string) => {
    playNotificationSound(soundType);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Notificações
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Notificações</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled">Som de notificação</Label>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>
            
            {settings.soundEnabled && (
              <div className="space-y-2">
                <Label>Tipo de som</Label>
                <div className="flex gap-2">
                  <Select 
                    value={settings.soundType} 
                    onValueChange={(value: any) => updateSettings({ soundType: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ping">Ping</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="bell">Sino</SelectItem>
                      <SelectItem value="tap">Tap</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestSound(settings.soundType)}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="visual-enabled">Notificações visuais</Label>
            <Switch
              id="visual-enabled"
              checked={settings.visualEnabled}
              onCheckedChange={(checked) => updateSettings({ visualEnabled: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="browser-notifications">Notificações do navegador</Label>
            <Switch
              id="browser-notifications"
              checked={settings.browserNotifications}
              onCheckedChange={(checked) => updateSettings({ browserNotifications: checked })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
