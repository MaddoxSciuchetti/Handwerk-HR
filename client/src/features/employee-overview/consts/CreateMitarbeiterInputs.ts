export const CreateMitarbeiterInputs = [
  {
    name: 'firstName' as const,
    placeholder: 'Vorname',
    type: 'text',
  },
  {
    name: 'lastName' as const,
    placeholder: 'Nachname',
    type: 'text',
  },
  {
    name: 'email' as const,
    placeholder: 'email',
    type: 'email',
  },
  {
    name: 'password' as const,
    placeholder: 'password',
    type: 'password',
  },
  {
    name: 'confirmPassword' as const,
    placeholder: 'Confirm Password',
    type: 'password',
  },
] as const;

export type TCreateMitarbeiter = (typeof CreateMitarbeiterInputs)[number];
