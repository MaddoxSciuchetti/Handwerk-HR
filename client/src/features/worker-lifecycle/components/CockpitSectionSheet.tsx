import { useState } from 'react';
import {
  DrawerLayer,
  DrawerStackProvider,
  useDrawerStack,
} from '@/components/ui/drawer-stack';
import {
  COCKPIT_SECTIONS,
  type CockpitSectionId,
} from './cockpit-section.consts';
import { CockpitSectionBody } from './cockpitSections';

type CockpitSectionSheetProps = {
  openSection: CockpitSectionId | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CockpitSectionSheet(props: CockpitSectionSheetProps) {
  const stack = useDrawerStack();
  // Also support consumers that mount a section drawer on its own.
  return stack ? (
    <SectionLayer {...props} />
  ) : (
    <DrawerStackProvider>
      <SectionLayer {...props} />
    </DrawerStackProvider>
  );
}

function SectionLayer({
  openSection,
  isLoading,
  onOpenChange,
}: CockpitSectionSheetProps) {
  const [section, setSection] = useState(openSection);
  if (openSection && section !== openSection) setSection(openSection);
  const title =
    COCKPIT_SECTIONS.find((item) => item.id === section)?.title ?? 'Bereich';
  return (
    <DrawerLayer
      open={openSection !== null}
      title={title}
      onClose={() => onOpenChange(false)}
      onClosed={() => setSection(null)}
    >
      {section ? (
        <CockpitSectionBody id={section} isLoading={isLoading} />
      ) : null}
    </DrawerLayer>
  );
}
