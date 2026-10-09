import { useContext, useEffect, useRef, type DragEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  getDraggedQuestionnaireAnswer,
  setDraggedQuestionnaireAnswer,
} from '@/features/worker-task-management/components/files/questionnaireAnswerDrag';

import { DocumentValuesContext } from './DocumentValuesContext';

type InlineValueProps = {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
};
function InlineValue({ label, value, readOnly, onChange }: InlineValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value)
      ref.current.textContent = value;
  }, [value]);
  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={label}
      aria-readonly={readOnly}
      data-placeholder={label}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      className="document-inline-value mx-0.5 border-b border-blue-400 bg-blue-50 px-0.5 outline-none"
      style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onPaste={(e) => {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const text = window.document.createTextNode(
          e.clipboardData.getData('text/plain')
        );
        range.insertNode(text);
        range.setStartAfter(text);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        onChange(ref.current?.innerText ?? '');
      }}
    />
  );
}

function DocumentFieldView({ node, updateAttributes }: NodeViewProps) {
  const context = useContext(DocumentValuesContext);
  const key = String(node.attrs.key);
  const label = String(node.attrs.label);
  const value =
    context.values[key] ?? (node.attrs.fieldType === 'checkbox' ? 'false' : '');
  const inputValue =
    node.attrs.fieldType === 'date' && /^\d{2}\.\d{2}\.\d{4}$/.test(value)
      ? value.split('.').reverse().join('-')
      : value;
  return (
    <NodeViewWrapper
      as="span"
      className="inline"
      contentEditable={false}
      onDragOver={(e: DragEvent<HTMLSpanElement>) => {
        if (
          !context.master &&
          !context.readOnly &&
          getDraggedQuestionnaireAnswer()
        )
          e.preventDefault();
      }}
      onDrop={(e: DragEvent<HTMLSpanElement>) => {
        const answer = getDraggedQuestionnaireAnswer();
        if (answer && !context.master && !context.readOnly) {
          e.preventDefault();
          context.onValueChange(key, answer.value);
          setDraggedQuestionnaireAnswer(null);
        }
      }}
    >
      {context.master ? (
        <span
          data-drag-handle
          className="mx-0.5 rounded border bg-blue-50 px-1 text-blue-900"
          title={key}
          onDoubleClick={() => {
            if (context.readOnly) return;
            const next = window.prompt(
              'Feldbezeichnung (Schlüssel bleibt unverändert)',
              label
            );
            if (next?.trim()) updateAttributes({ label: next.trim() });
          }}
        >
          {node.attrs.fieldType === 'checkbox' ? '☐ ' : ''}
          {label}
        </span>
      ) : node.attrs.fieldType === 'text' ? (
        <InlineValue
          label={label}
          value={value}
          readOnly={context.readOnly}
          onChange={(next) => context.onValueChange(key, next)}
        />
      ) : node.attrs.fieldType === 'checkbox' ? (
        <input
          type="checkbox"
          aria-label={label}
          checked={value === 'true'}
          disabled={context.readOnly}
          onChange={(e) =>
            context.onValueChange(key, e.target.checked ? 'true' : 'false')
          }
          className="mx-1 align-middle"
        />
      ) : (
        <input
          aria-label={label}
          type={node.attrs.fieldType === 'date' ? 'date' : 'text'}
          value={inputValue}
          placeholder={label}
          readOnly={context.readOnly}
          size={Math.max(value.length, label.length, 4)}
          className="mx-0.5 max-w-full border-b border-blue-400 bg-blue-50 px-0.5 outline-none"
          style={{ font: 'inherit', color: 'inherit' }}
          onChange={(e) => context.onValueChange(key, e.target.value)}
          onDragOver={(e) => {
            if (!context.readOnly && getDraggedQuestionnaireAnswer())
              e.preventDefault();
          }}
          onDrop={(e) => {
            const answer = getDraggedQuestionnaireAnswer();
            if (answer && !context.readOnly) {
              e.preventDefault();
              context.onValueChange(key, answer.value);
              setDraggedQuestionnaireAnswer(null);
            }
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

export const DocumentFieldNode = Node.create({
  name: 'documentField',
  group: 'inline',
  inline: true,
  atom: true,
  marks: '_',
  draggable: true,
  addAttributes() {
    return {
      key: { default: '' },
      label: { default: '' },
      fieldType: { default: 'text' },
      required: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-document-field]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-document-field': '' }),
      HTMLAttributes.label,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DocumentFieldView);
  },
});
