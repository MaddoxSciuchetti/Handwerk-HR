export const Inputs = [
  {
    name: 'firstName' as const,
    placeholder: 'Vorname',
    required: true,
  },
  {
    name: 'lastName' as const,
    placeholder: 'Nachname',
    required: false,
  },
  {
    name: 'email' as const,
    placeholder: 'Email',
    required: false,
  },
  {
    name: 'birthday' as const,
    placeholder: 'Geburtsdatum DD.MM.YYYY',
    required: false,
  },
  {
    name: 'street' as const,
    placeholder: 'Adresse',
    required: false,
  },
  {
    name: 'entryDate' as const,
    placeholder: 'Eintrittsdatum DD.MM.YYYY',
    required: false,
  },
  {
    name: 'position' as const,
    placeholder: 'Position',
    required: false,
  },
];
