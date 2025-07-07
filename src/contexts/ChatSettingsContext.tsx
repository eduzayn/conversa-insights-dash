
import { createContext, useContext, useState, ReactNode } from 'react';
import { ChatSettings, defaultChatSettings } from '@/types/chatSettings';

interface ChatSettingsContextType {
  settings: ChatSettings;
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
  resetToDefaults: () => void;
}

const ChatSettingsContext = createContext<ChatSettingsContextType | undefined>(undefined);

export const useChatSettings = () => {
  const context = useContext(ChatSettingsContext);
  if (!context) {
    throw new Error('useChatSettings must be used within a ChatSettingsProvider');
  }
  return context;
};

export const ChatSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const stored = localStorage.getItem('chatSettings');
    return stored ? { ...defaultChatSettings, ...JSON.parse(stored) } : defaultChatSettings;
  });

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('chatSettings', JSON.stringify(updatedSettings));
  };

  const resetToDefaults = () => {
    setSettings(defaultChatSettings);
    localStorage.setItem('chatSettings', JSON.stringify(defaultChatSettings));
  };

  return (
    <ChatSettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </ChatSettingsContext.Provider>
  );
};
