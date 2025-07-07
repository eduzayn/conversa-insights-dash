
import { X } from "lucide-react";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

export const ReplyPreview = ({ message, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-4 mb-2 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 mb-1">
            Respondendo a {message.senderName}
          </p>
          <p className="text-sm text-blue-700 truncate">
            {message.content}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-800 p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
