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
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
      {(['header', 'content', 'footer'] as const)
        .filter(
          (section) =>
            section === 'content' ||
            props.document[section].content?.some(
              (node) => node.content?.length || node.type === 'image'
            )
        )
        .map((section) => (
          <StyledDocumentEditor key={section} {...props} section={section} />
        ))}
    </div>
  );
}
