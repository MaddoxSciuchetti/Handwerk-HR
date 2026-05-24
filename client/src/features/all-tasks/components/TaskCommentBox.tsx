import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type TaskCommentBoxProps = {
  commentText: string;
  onCommentTextChange: (value: string) => void;
  editingCommentId: string | null;
  onCancelEdit: () => void;
  disabled?: boolean;
};

export function TaskCommentBox({
  commentText,
  onCommentTextChange,
  editingCommentId,
  onCancelEdit,
  disabled = false,
}: TaskCommentBoxProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="task-comment">Kommentar</Label>
        {editingCommentId ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
            onClick={onCancelEdit}
          >
            Bearbeiten abbrechen
          </Button>
        ) : null}
      </div>
      <Textarea
        id="task-comment"
        value={commentText}
        disabled={disabled}
        onChange={(e) => onCommentTextChange(e.target.value)}
        placeholder="Kommentar hinzufügen… (mit Speichern übernehmen)"
        rows={3}
      />
    </div>
  );
}
