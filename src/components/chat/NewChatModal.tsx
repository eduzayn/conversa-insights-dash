
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageCircle } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewChatModal = ({ open, onOpenChange }: NewChatModalProps) => {
  const { users, teams, currentUser, createPrivateChat } = useChatContext();
  const [chatType, setChatType] = useState<'private' | 'team'>('private');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const availableUsers = users.filter(user => user.id !== currentUser?.id);

  const handleCreateChat = () => {
    if (chatType === 'private' && selectedUserId) {
      createPrivateChat(selectedUserId);
      onOpenChange(false);
      resetForm();
    }
    // Note: Team chat creation would require additional logic in the context
  };

  const resetForm = () => {
    setChatType('private');
    setSelectedUserId('');
    setSelectedTeamId('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="chatType">Tipo de Conversa</Label>
            <Select value={chatType} onValueChange={(value: 'private' | 'team') => setChatType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Conversa Privada
                  </div>
                </SelectItem>
                <SelectItem value="team" disabled>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Conversa de Equipe (Em breve)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {chatType === 'private' && (
            <div>
              <Label htmlFor="user">Selecionar Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <span>{user.name}</span>
                        {user.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateChat}
              disabled={chatType === 'private' && !selectedUserId}
              className="bg-green-600 hover:bg-green-700"
            >
              Criar Conversa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
