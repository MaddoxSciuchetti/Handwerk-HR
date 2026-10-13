import { useState } from 'react';
import { CertificatePreviewDialog } from './CertificatePreviewDialog';

export type EngagementCertificateLink = {
  id: string;
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
      <ul>
        {certificates.map((certificate) => (
          <li key={certificate.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between border-b border-border py-4 pr-2 pl-10 text-left hover:bg-muted/40"
              onClick={() => setOpenId(certificate.id)}
            >
              <span className="text-sm font-medium">{certificate.name}</span>
              <span className="text-xs text-muted-foreground">Versendet</span>
            </button>
          </li>
        ))}
      </ul>
      {open ? (
        <CertificatePreviewDialog
          name={open.name}
          text={open.text}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
