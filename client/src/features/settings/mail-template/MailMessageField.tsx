import { useRef } from 'react';
import { MailBodyEditor, type MailBodyEditorHandle } from './MailBodyEditor';
import { MailPlaceholderPill } from './MailPlaceholderPill';

type MailMessageFieldProps = {
  id: string;
  labelledBy: string;
  value: string;
  placeholders: readonly string[];
  onChange: (value: string) => void;
};

export function MailMessageField({
  id,
  labelledBy,
  value,
  placeholders,
  onChange,
}: MailMessageFieldProps) {
  const editorRef = useRef<MailBodyEditorHandle>(null);
  const caretRef = useRef<Range | null>(null);
  const rememberCaret = () => {
    const editor = document.getElementById(id);
    const selection = window.getSelection();
    if (
      editor &&
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode)
    ) {
      caretRef.current = selection.getRangeAt(0).cloneRange();
      return;
    }
    caretRef.current = null;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {placeholders.map((token) => (
          <MailPlaceholderPill
            key={token}
            token={token}
            onRememberCaret={rememberCaret}
            onInsert={(placeholder) =>
              editorRef.current?.insertPlaceholder(
                placeholder,
                caretRef.current
              )
            }
          />
        ))}
      </div>
      <MailBodyEditor
        ref={editorRef}
        id={id}
        labelledBy={labelledBy}
        value={value}
        tokens={placeholders}
        onChange={onChange}
      />
    </div>
  );
}
