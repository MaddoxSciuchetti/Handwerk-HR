import { createContext } from 'react';

export const DocumentValuesContext = createContext<{
  master: boolean;
  readOnly: boolean;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
}>({
  master: true,
  readOnly: false,
  values: {},
  onValueChange: () => undefined,
});
