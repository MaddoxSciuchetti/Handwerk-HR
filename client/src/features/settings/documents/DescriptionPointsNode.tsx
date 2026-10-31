import { useContext } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { DescriptionPointsEditor } from './components/DescriptionPointsEditor';
import { DocumentFieldDetails } from './components/DocumentFieldDetails';
import { DocumentFieldRemove } from './components/DocumentFieldRemove';
import { DocumentValuesContext } from './DocumentValuesContext';

function MasterDescriptionPoints({
  fieldKey,
  label,
  readOnly,
  onRename,
  onKeyChange,
  onRemove,
}: {
  fieldKey: string;
  label: string;
  readOnly: boolean;
  onRename: (label: string) => void;
  onKeyChange: (key: string) => void;
  onRemove: () => void;
}) {
  return (
    <DocumentFieldDetails
      fieldKey={fieldKey}
      label={label}
      onLabelChange={readOnly ? undefined : onRename}
      onKeyChange={readOnly ? undefined : onKeyChange}
      onRemove={readOnly ? undefined : onRemove}
    >
      <div data-drag-handle className="cursor-grab">
        <p className="text-sm font-medium text-blue-950">{label}</p>
        <p className="mt-1 text-xs leading-5 text-blue-900/80">
          Diese Punkte werden vor dem Versand eingetragen. Sie haben keinen
          gespeicherten Wert.
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {fieldKey}
        </p>
      </div>
    </DocumentFieldDetails>
  );
}

function DescriptionPointsView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const context = useContext(DocumentValuesContext);
  const key = String(node.attrs.key);
  const label = String(node.attrs.label);
  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className="group/document-field relative my-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-slate-900"
      data-description-points=""
    >
      {context.master ? (
        <MasterDescriptionPoints
          fieldKey={key}
          label={label}
          readOnly={context.readOnly}
          onRename={(next) => updateAttributes({ label: next })}
          onKeyChange={(next) => updateAttributes({ key: next })}
          onRemove={deleteNode}
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
          {!context.readOnly ? (
            <DocumentFieldRemove label={label} onRemove={deleteNode} />
          ) : null}
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
