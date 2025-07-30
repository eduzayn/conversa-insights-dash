
import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const notificationSounds = [
  {
    label: '🌊 Ping Oceânico',
    value: 'oceanic',
    file: '/sounds/notif_ping_oceanico.mp3',
  },
  {
    label: '🎶 Toque Harmônico',
    value: 'harmonic',
    file: '/sounds/notif_toque_harmonico.mp3',
  },
  {
    label: '🔔 Sino Minimalista',
    value: 'minimalist',
    file: '/sounds/notif_sino_minimalista.mp3',
  },
  {
    label: '✨ Pulsar Aéreo',
    value: 'airy',
    file: '/sounds/notif_pulsar_aereo.mp3',
  },
];

interface NotificationSoundSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  volume: number;
}

export const NotificationSoundSelect: React.FC<NotificationSoundSelectProps> = ({
  value,
  onValueChange,
  volume
}) => {
  const playSound = (soundValue: string) => {
    const sound = notificationSounds.find(s => s.value === soundValue);
    if (sound) {
      const audio = new Audio(sound.file);
      audio.volume = volume / 100;
      audio.play().catch(() => {
        // Não foi possível reproduzir o som
      });
    }
  };

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    playSound(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {notificationSounds.map((sound) => (
            <SelectItem key={sound.value} value={sound.value}>
              {sound.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={() => playSound(value)}
        title="Ouvir novamente"
      >
        <Play className="h-3 w-3" />
      </Button>
    </div>
  );
};
