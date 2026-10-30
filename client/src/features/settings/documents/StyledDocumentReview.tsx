import type { StyledDocument } from './styledDocument';
import { StyledDocumentEditor } from './StyledDocumentEditor';

type StyledDocumentReviewProps = {
  document: StyledDocument;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  onDocumentChange?: (document: StyledDocument) => void;
  readOnly: boolean;
};
export function StyledDocumentReview({
  onDocumentChange,
  ...props
}: StyledDocumentReviewProps) {
  return (
    <StyledDocumentEditor
      {...props}
      onChange={onDocumentChange}
      section="content"
      pageView
    />
  );
}
