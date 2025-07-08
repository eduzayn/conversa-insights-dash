
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageCircle } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { CreateTeamForm } from "./CreateTeamForm";

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewChatModal = ({ open, onOpenChange }: NewChatModalProps) => {
  const { users, currentUser, createPrivateChat } = useChatContext();
  const [chatType, setChatType] = useState<'private' | 'team'>('private');
  const [selectedUserId, setSelectedUserId] = useState('');

  const availableUsers = users.filter(user => user.id !== currentUser?.id);

  const handleCreatePrivateChat = () => {
    if (selectedUserId) {
      createPrivateChat(selectedUserId);
      handleClose();
    }
  };

  const handleTeamCreated = () => {
    handleClose();
  };

  const resetForm = () => {
    setChatType('private');
    setSelectedUserId('');
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
            <label htmlFor="chatType" className="block text-sm font-medium mb-2">
              Tipo de Conversa
            </label>
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
                <SelectItem value="team">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Nova Equipe
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {chatType === 'private' && (
            <>
              <div>
                <label htmlFor="user" className="block text-sm font-medium mb-2">
                  Selecionar Usuário
                </label>
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreatePrivateChat}
                  disabled={!selectedUserId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Criar Conversa
                </Button>
              </div>
            </>
          )}

          {chatType === 'team' && (
            <CreateTeamForm 
              onSuccess={handleTeamCreated}
              onCancel={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
