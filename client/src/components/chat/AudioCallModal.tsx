
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioCallRoom } from "./AudioCallRoom";
import { Chat, User } from "@/types/chat";

interface AudioCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
  currentUser: User | null;
}

export const AudioCallModal = ({ open, onOpenChange, chat, currentUser }: AudioCallModalProps) => {
  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chamada de Áudio - {chat.name}</DialogTitle>
        </DialogHeader>
        <AudioCallRoom 
          chat={chat}
          currentUser={currentUser}
          onEndCall={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
