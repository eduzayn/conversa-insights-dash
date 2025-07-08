
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useChatContext } from "@/contexts/ChatContext";

interface CreateTeamFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const teamIcons = ['👥', '💼', '🛠️', '📊', '🎯', '🚀', '💡', '🏆', '📈', '🔧', '📱', '🎨'];

export const CreateTeamForm = ({ onSuccess, onCancel }: CreateTeamFormProps) => {
  const { users, currentUser, createTeam } = useChatContext();
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(teamIcons[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const availableUsers = users.filter(user => user.id !== currentUser?.id);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateTeam = () => {
    if (!teamName.trim() || !teamDescription.trim()) return;

    // Incluir o usuário atual automaticamente
    const memberIds = currentUser ? [currentUser.id, ...selectedMembers] : selectedMembers;

    try {
      createTeam({
        name: teamName.trim(),
        description: teamDescription.trim(),
        icon: selectedIcon,
        memberIds
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
    }
  };

  const isFormValid = teamName.trim() && teamDescription.trim() && selectedMembers.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="teamName">Nome da Equipe</Label>
        <Input
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Ex: Marketing Digital"
          maxLength={50}
        />
      </div>

      <div>
        <Label htmlFor="teamDescription">Descrição</Label>
        <Textarea
          id="teamDescription"
          value={teamDescription}
          onChange={(e) => setTeamDescription(e.target.value)}
          placeholder="Descreva o propósito da equipe..."
          maxLength={200}
          rows={3}
        />
      </div>

      <div>
        <Label>Ícone da Equipe</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {teamIcons.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setSelectedIcon(icon)}
              className={`w-10 h-10 text-xl rounded-lg border-2 hover:bg-gray-100 transition-colors ${
                selectedIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Membros da Equipe</Label>
        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 mt-2 space-y-2">
          {availableUsers.map(user => (
            <div key={user.id} className="flex items-center space-x-2">
              <Checkbox
                id={`member-${user.id}`}
                checked={selectedMembers.includes(user.id)}
                onCheckedChange={() => handleMemberToggle(user.id)}
              />
              <label 
                htmlFor={`member-${user.id}`}
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm">{user.name}</span>
                {user.isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Você será automaticamente adicionado à equipe
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleCreateTeam}
          disabled={!isFormValid}
          className="bg-green-600 hover:bg-green-700"
        >
          Criar Equipe
        </Button>
      </div>
    </div>
  );
};
