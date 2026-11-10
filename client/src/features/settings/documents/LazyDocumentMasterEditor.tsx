import { lazy, Suspense } from 'react';
import { DocumentMasterEditorSkeleton } from './components/DocumentEditorSkeleton';

const DocumentMasterEditor = lazy(() =>
  import('./DocumentMasterEditor').then((module) => ({
    default: module.DocumentMasterEditor,
  }))
);

type LazyDocumentMasterEditorProps = {
  id: string;
};

export function LazyDocumentMasterEditor({
  id,
}: LazyDocumentMasterEditorProps) {
  return (
    <Suspense fallback={<DocumentMasterEditorSkeleton />}>
      <DocumentMasterEditor id={id} />
    </Suspense>
  );
}
