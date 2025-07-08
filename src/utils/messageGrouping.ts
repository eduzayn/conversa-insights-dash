
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtendimentoMessage } from '@/types/atendimento-aluno';

export interface MessageGroup {
  date: Date;
  dateLabel: string;
  messages: AtendimentoMessage[];
}

export const groupMessagesByDate = (messages: AtendimentoMessage[]): MessageGroup[] => {
  const groups: { [key: string]: MessageGroup } = {};

  messages.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const dateKey = format(messageDate, 'yyyy-MM-dd');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: messageDate,
        dateLabel: getDateLabel(messageDate),
        messages: []
      };
    }

    groups[dateKey].messages.push(message);
  });

  return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const getDateLabel = (date: Date): string => {
  if (isToday(date)) {
    return 'Hoje';
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }
  
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};
