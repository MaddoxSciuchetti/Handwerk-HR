import { createFileRoute } from '@tanstack/react-router';
import DocumentationPage from '@/features/documentation/DocumentationPage';

export const Route = createFileRoute('/docs/$')({
  component: DocumentationPage,
});
