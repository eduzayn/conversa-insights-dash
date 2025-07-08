
export interface ChatSettings {
  // Notificações Visuais
  showNotificationBalloon: boolean;
  highlightUnreadChannels: boolean;
  showNewBadgeOnPinned: boolean;
  showUnreadCount: boolean;
  enableMentionAlert: boolean;
  enableLightAnimation: boolean;

  // Notificações de Áudio
  playSoundOnNewMessage: boolean;
  playSoundOnMention: boolean;
  playSoundOnNewAudio: boolean;
  playSoundOnlyInBackground: boolean;
  notificationVolume: number;
  soundStyle: 'oceanic' | 'harmonic' | 'minimalist' | 'airy';

  // Privacidade e Comportamento
  autoJoinTeamChannels: boolean;
  showOnlineOnOpen: boolean;
  hideLastSeen: boolean;
  notifyAdminOnTeamChange: boolean;

  // Resumos e E-mail
  receiveDailySummary: boolean;
  receiveEmailOnMention: boolean;
}

export const defaultChatSettings: ChatSettings = {
  // Notificações Visuais
  showNotificationBalloon: true,
  highlightUnreadChannels: true,
  showNewBadgeOnPinned: true,
  showUnreadCount: true,
  enableMentionAlert: true,
  enableLightAnimation: false,

  // Notificações de Áudio
  playSoundOnNewMessage: true,
  playSoundOnMention: true,
  playSoundOnNewAudio: true,
  playSoundOnlyInBackground: false,
  notificationVolume: 50,
  soundStyle: 'harmonic',

  // Privacidade e Comportamento
  autoJoinTeamChannels: true,
  showOnlineOnOpen: true,
  hideLastSeen: false,
  notifyAdminOnTeamChange: false,

  // Resumos e E-mail
  receiveDailySummary: false,
  receiveEmailOnMention: false,
};

export const soundStyles = [
  { value: 'oceanic', label: '🌊 Ping Oceânico' },
  { value: 'harmonic', label: '🎶 Toque Harmônico' },
  { value: 'minimalist', label: '🔔 Sino Minimalista' },
  { value: 'airy', label: '✨ Pulsar Aéreo' },
] as const;
