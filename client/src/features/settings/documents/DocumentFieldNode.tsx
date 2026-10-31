import { useContext, useEffect, useRef } from 'react';
import {
  currentDocumentDate,
  normalizeDocumentFieldValue,
} from '@shared/document';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { useQuestionnaireAnswerDrop } from '@/features/worker-task-management/components/files/questionnaireAnswerDrag';

import { DocumentFieldDetails } from './components/DocumentFieldDetails';
import { DocumentFieldRemove } from './components/DocumentFieldRemove';
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
      title={value || label}
      data-placeholder={label}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      className="document-inline-value mx-0.5 border-b border-blue-400 bg-blue-50 px-0.5 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        display: 'inline-block',
        maxWidth: '100%',
        verticalAlign: 'bottom',
        whiteSpace: 'nowrap',
        overflowWrap: 'normal',
        overflowX: readOnly ? 'hidden' : 'auto',
        textOverflow: readOnly ? 'ellipsis' : 'clip',
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing)
          event.preventDefault();
      }}
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onPaste={(e) => {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const text = window.document.createTextNode(
          e.clipboardData.getData('text/plain').replace(/\r\n|[\r\n]/g, ' ')
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

function MasterDocumentField({
  fieldKey,
  label,
  fieldType,
  readOnly,
  onRename,
  onKeyChange,
  useToday,
  onUseTodayChange,
}: {
  fieldKey: string;
  label: string;
  fieldType: string;
  readOnly: boolean;
  onRename: (label: string) => void;
  onKeyChange: (key: string) => void;
  useToday: boolean;
  onUseTodayChange: (checked: boolean) => void;
}) {
  return (
    <DocumentFieldDetails
      fieldKey={fieldKey}
      label={label}
      useToday={useToday}
      onUseTodayChange={
        fieldType === 'date' && !readOnly ? onUseTodayChange : undefined
      }
      onLabelChange={readOnly ? undefined : onRename}
      onKeyChange={readOnly ? undefined : onKeyChange}
    >
      <span
        data-drag-handle
        className="inline-block max-w-full align-bottom"
        title={`${label} (${fieldKey})`}
      >
        {fieldType === 'checkbox' ? (
          <span
            role="checkbox"
            aria-checked={false}
            aria-disabled="true"
            aria-label={label}
            className="mx-0.5 inline-block size-3.5 rounded-[2px] border border-current bg-blue-50 align-[-0.125em]"
          />
        ) : (
          <span
            title={`${label} (${fieldKey})`}
            className="mx-0.5 inline-block max-w-full overflow-hidden rounded border bg-blue-50 px-1 align-bottom text-ellipsis whitespace-nowrap text-blue-900"
          >
            {label}
            {useToday ? ' (heute)' : ''}
          </span>
        )}
      </span>
    </DocumentFieldDetails>
  );
}

function DocumentFieldView({
  node,
  updateAttributes,
  editor,
  deleteNode,
}: NodeViewProps) {
  const context = useContext(DocumentValuesContext);
  const key = String(node.attrs.key);
  const label = String(node.attrs.label);
  const useToday =
    node.attrs.fieldType === 'date' && node.attrs.dateMode === 'today';
  const value =
    useToday && (!context.readOnly || !context.values[key])
      ? currentDocumentDate()
      : (context.values[key] ??
        node.attrs.checkboxValue ??
        (node.attrs.fieldType === 'checkbox' ? 'false' : ''));
  const inputValue =
    node.attrs.fieldType === 'date' && /^\d{2}\.\d{2}\.\d{4}$/.test(value)
      ? value.split('.').reverse().join('-')
      : value;
  const glyph = node.attrs.checkboxGlyph;
  const checked = value === 'true';
  const checkboxSymbol = checked
    ? glyph === '□'
      ? '×'
      : glyph === '☑'
        ? '☑'
        : '☒'
    : glyph === '□'
      ? '□'
      : '☐';
  const answerDrop = useQuestionnaireAnswerDrop<HTMLSpanElement>(
    !context.master && !context.readOnly && !useToday,
    (answer) =>
      context.onValueChange(
        key,
        normalizeDocumentFieldValue(node.attrs.fieldType, answer)
      )
  );
  return (
    <NodeViewWrapper
      as="span"
      {...answerDrop}
      className={`group/document-field relative inline-block max-w-full align-baseline whitespace-nowrap ${context.readOnly ? '' : 'pr-4'} ${answerDrop.className}`}
      style={{ whiteSpace: 'nowrap' }}
      contentEditable={false}
    >
      {node.attrs.fieldType === 'checkbox' && glyph ? (
        context.master ? (
          <span
            data-drag-handle
            title={`${label} (${key})`}
            aria-label={`${label} (${key})`}
          >
            {glyph}
          </span>
        ) : (
          <span
            style={{ position: 'relative', display: 'inline-block' }}
            title={`${label} (${key})`}
          >
            <span
              aria-hidden="true"
              style={{
                visibility:
                  checkboxSymbol !== glyph && glyph !== '□'
                    ? 'hidden'
                    : 'visible',
              }}
            >
              {glyph}
            </span>
            {checkboxSymbol !== glyph ? (
              <span
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, textAlign: 'center' }}
              >
                {checkboxSymbol}
              </span>
            ) : null}
            <input
              type="checkbox"
              aria-label={label}
              checked={checked}
              disabled={context.readOnly}
              onChange={(event) =>
                context.onValueChange(
                  key,
                  event.target.checked ? 'true' : 'false'
                )
              }
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                opacity: 0,
                cursor: context.readOnly ? 'default' : 'pointer',
              }}
            />
          </span>
        )
      ) : context.master ? (
        <MasterDocumentField
          fieldKey={key}
          label={label}
          fieldType={String(node.attrs.fieldType)}
          readOnly={context.readOnly}
          onRename={(next) => updateAttributes({ label: next })}
          onKeyChange={(next) => updateAttributes({ key: next })}
          useToday={useToday}
          onUseTodayChange={(checked) => {
            const transaction = editor.state.tr;
            editor.state.doc.descendants((field, pos) => {
              if (
                field.type.name === 'documentField' &&
                field.attrs.key === key &&
                field.attrs.fieldType === 'date'
              )
                transaction.setNodeMarkup(pos, undefined, {
                  ...field.attrs,
                  dateMode: checked ? 'today' : null,
                });
            });
            editor.view.dispatch(transaction);
          }}
        />
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
          readOnly={context.readOnly || useToday}
          size={Math.max(value.length, label.length, 4)}
          className="mx-0.5 max-w-full border-b border-blue-400 bg-blue-50 px-0.5 outline-none"
          style={{ font: 'inherit', color: 'inherit' }}
          onChange={(e) => context.onValueChange(key, e.target.value)}
        />
      )}
      {!context.readOnly ? (
        <DocumentFieldRemove label={label} onRemove={deleteNode} />
      ) : null}
    </NodeViewWrapper>
  );
}

export const DocumentFieldNode = Node.create({
  name: 'documentField',
  selectable: false,
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
      checkboxGlyph: { default: null },
      checkboxValue: { default: null },
      dateMode: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-document-field]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-document-field': '' }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DocumentFieldView);
  },
});
