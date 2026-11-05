import { Callout } from 'fumadocs-ui/components/callout';
import type { ReactNode } from 'react';

type HintProps = {
  title?: string;
  children: ReactNode;
};

export function Hint({ title = 'Hinweis', children }: HintProps) {
  return (
    <Callout type="idea" title={title}>
      {children}
    </Callout>
  );
}
