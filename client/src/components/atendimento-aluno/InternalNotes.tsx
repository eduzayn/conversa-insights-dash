
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InternalNote } from "@/types/atendimento-aluno";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StickyNote, Save } from "lucide-react";

interface InternalNotesProps {
  notes: InternalNote[];
  onSaveNote: (content: string) => void;
  currentUser: any;
}

export const InternalNotes = ({ notes, onSaveNote, currentUser }: InternalNotesProps) => {
  const [newNote, setNewNote] = useState("");

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    
    onSaveNote(newNote.trim());
    setNewNote("");
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notas Internas (Apenas para atendentes)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Notas existentes */}
        {notes.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <p className="text-sm">{note.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Por {note.authorName} • {formatDistanceToNow(note.timestamp, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Campo para nova nota */}
        <div className="space-y-2">
          <Label htmlFor="new-note">Adicionar nova nota:</Label>
          <Textarea
            id="new-note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ex: Aluno relatou dificuldade com o conteúdo da aula 3..."
            className="min-h-[80px]"
          />
          <Button 
            onClick={handleSaveNote}
            disabled={!newNote.trim()}
            size="sm"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Nota
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
