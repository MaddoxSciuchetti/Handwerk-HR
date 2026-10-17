import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';
import { CertificatePreviewDialog } from './CertificatePreviewDialog';
import { fileBoxTitle } from './fileBoxTitle';
import { StoredFileBox } from './StoredFileBox';

export type EngagementCertificateLink = {
  id: string;
  engagementId: string;
  name: string;
  text: string;
};

type EngagementCertificateListProps = {
  certificates: EngagementCertificateLink[];
};

export function EngagementCertificateList({
  certificates,
}: EngagementCertificateListProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = certificates.find((certificate) => certificate.id === openId);

  if (!certificates.length) return null;

  return (
    <>
      {certificates.map((certificate) => (
        <StoredFileBox
          key={certificate.id}
          label={fileBoxTitle(certificate.name, 'Arbeitszeugnis')}
          icon={FileText}
          onOpen={() => setOpenId(certificate.id)}
        />
      ))}
      {open
        ? createPortal(
            <CertificatePreviewDialog
              name={fileBoxTitle(open.name, 'Arbeitszeugnis')}
              text={open.text}
              onClose={() => setOpenId(null)}
            />,
            document.body
          )
        : null}
    </>
  );
}
