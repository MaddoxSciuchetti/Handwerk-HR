import type { StyledDocument } from './styledDocument';
import { StyledDocumentEditor } from './StyledDocumentEditor';

type StyledDocumentReviewProps = {
  document: StyledDocument;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  readOnly: boolean;
};
export function StyledDocumentReview(props: StyledDocumentReviewProps) {
  return (
    <StyledDocumentEditor
      {...props}
      section="content"
      pageView
      showZoomNote={false}
    />
  );
}
