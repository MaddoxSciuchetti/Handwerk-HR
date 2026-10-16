import { useContext } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { DescriptionPointsEditor } from './components/DescriptionPointsEditor';
import { DocumentValuesContext } from './DocumentValuesContext';

function MasterDescriptionPoints({
  fieldKey,
  label,
  readOnly,
  onRename,
}: {
  fieldKey: string;
  label: string;
  readOnly: boolean;
  onRename: (label: string) => void;
}) {
  const rename = () => {
    if (readOnly) return;
    const next = window.prompt(
      'Bezeichnung (Schlüssel bleibt unverändert)',
      label
    );
    if (next?.trim()) onRename(next.trim());
  };
  return (
    <div data-drag-handle className="cursor-grab" onDoubleClick={rename}>
      <p className="text-sm font-medium text-blue-950">{label}</p>
      <p className="mt-1 text-xs leading-5 text-blue-900/80">
        Diese Punkte werden vor dem Versand eingetragen. Sie haben keinen
        gespeicherten Wert.
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        {fieldKey}
      </p>
    </div>
  );
}

function DescriptionPointsView({ node, updateAttributes }: NodeViewProps) {
  const context = useContext(DocumentValuesContext);
  const key = String(node.attrs.key);
  const label = String(node.attrs.label);
  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className="my-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2"
      data-description-points=""
    >
      {context.master ? (
        <MasterDescriptionPoints
          fieldKey={key}
          label={label}
          readOnly={context.readOnly}
          onRename={(next) => updateAttributes({ label: next })}
        />
      ) : (
        <>
          <p className="mb-1 text-xs font-medium text-blue-950">{label}</p>
          <DescriptionPointsEditor
            label={label}
            value={context.values[key] ?? ''}
            readOnly={context.readOnly}
            onChange={(next) => context.onValueChange(key, next)}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

export const DescriptionPointsNode = Node.create({
  name: 'descriptionPoints',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      key: { default: '' },
      label: { default: 'Tätigkeiten' },
      fieldType: { default: 'points' },
      required: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-description-points]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-description-points': '' }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DescriptionPointsView);
  },
});
