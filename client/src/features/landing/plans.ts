export type LandingPlan = {
  id: 'starter' | 'betrieb' | 'unternehmen';
  name: string;
  heading: string;
  price: string;
  includes: readonly [string, string, string];
  highlighted: boolean;
};

export const LANDING_PLANS: readonly LandingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    heading: 'The checklist for hiring and leaving',
    price: '30 €',
    includes: [
      'Questionnaire and documents stored on the employee',
      'Employment contract filled from those answers',
      'Onboarding and offboarding steps on one record',
    ],
    highlighted: false,
  },
  {
    id: 'betrieb',
    name: 'Betrieb',
    heading: 'AI features on the same checklist',
    price: '50 €',
    includes: [
      'Reads material receipts into the order lines',
      'Fills the employee record from the returned questionnaire',
      'Drafts the reference letter and the team mail',
    ],
    highlighted: true,
  },
  {
    id: 'unternehmen',
    name: 'Unternehmen',
    heading: 'Custom integrations, built for you',
    price: '100 €',
    includes: [
      'Integrations built for your dealers, payroll, or shop software',
      'Microsoft 365, ENGINE4, and your other tools wired in',
      'Extra steps built for how your company works',
    ],
    highlighted: false,
  },
];
