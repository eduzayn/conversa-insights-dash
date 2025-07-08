
import { useState, useEffect, useCallback } from 'react';
import { NotificationSettings } from '@/types/atendimento-aluno';
import { toast } from 'sonner';

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  visualEnabled: true,
  soundType: 'ping',
  browserNotifications: true
};

export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Verificar se as notificações do navegador estão disponíveis
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }

    // Carregar configurações do localStorage
    const savedSettings = localStorage.getItem('atendimento-notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('atendimento-notification-settings', JSON.stringify(updatedSettings));
  }, [settings]);

  const playNotificationSound = useCallback((soundType?: string) => {
    if (!settings.soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const type = soundType || settings.soundType;
    
    switch (type) {
      case 'ping':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        break;
      case 'pop':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        break;
      case 'bell':
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(261.63, audioContext.currentTime + 0.3);
        break;
      case 'tap':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.08);
        break;
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [settings]);

  const showBrowserNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if (!settings.browserNotifications || !permissionGranted) return;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });

    if (onClick) {
      notification.onclick = onClick;
    }

    setTimeout(() => notification.close(), 5000);
  }, [settings.browserNotifications, permissionGranted]);

  const showVisualNotification = useCallback((message: string) => {
    if (!settings.visualEnabled) return;
    
    toast.info(message, {
      duration: 3000,
      className: 'bg-blue-50 border-blue-200 text-blue-800'
    });
  }, [settings.visualEnabled]);

  const notifyNewMessage = useCallback((studentName: string, messageContent: string, onFocus?: () => void) => {
    // Som
    playNotificationSound();
    
    // Notificação visual no app
    showVisualNotification(`Nova mensagem de ${studentName}`);
    
    // Notificação do navegador (se estiver em outra aba)
    if (document.hidden) {
      showBrowserNotification(
        `Nova mensagem de ${studentName}`,
        `Atendimento do Portal do Aluno: ${messageContent.substring(0, 50)}...`,
        onFocus
      );
    }
  }, [playNotificationSound, showVisualNotification, showBrowserNotification]);

  return {
    settings,
    updateSettings,
    notifyNewMessage,
    playNotificationSound,
    showBrowserNotification,
    showVisualNotification,
    permissionGranted
  };
};
