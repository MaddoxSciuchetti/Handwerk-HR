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
    <div className="border-border flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="task-comment"
        >
          Kommentar
        </label>
        {editingCommentId ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs underline"
            onClick={onCancelEdit}
          >
            Bearbeiten abbrechen
          </button>
        ) : null}
      </div>
      <textarea
        id="task-comment"
        value={commentText}
        disabled={disabled}
        onChange={(e) => onCommentTextChange(e.target.value)}
        className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring min-h-[4.5rem] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
        placeholder="Kommentar hinzufügen… (mit Speichern übernehmen)"
        rows={3}
      />
    </div>
  );
}
