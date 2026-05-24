import { OptionsObjekt } from '@/components/ui/selfmade/selectdropdown';

const SORT_SUB_OPTIONS: OptionsObjekt[] = [
  { label: 'Neueste zuerst', value: 'desc' },
  { label: 'Älteste zuerst', value: 'asc' },
];

export const FILTER_OPTIONS: OptionsObjekt[] = [
  { label: 'All', value: 'all' },
  {
    label: 'Hinzugefügt',
    value: 'createdAt',
    subOptions: SORT_SUB_OPTIONS,
  },
  {
    label: 'Status',
    value: 'status',
  },
  { label: 'Verantwortlich', value: 'responsible' },
  {
    label: 'Type',
    value: 'engagementType',
    subOptions: [
      { label: 'Onboarding', value: 'onboarding' },
      { label: 'Offboarding', value: 'offboarding' },
      { label: 'Transfer', value: 'transfer' },
    ],
  },
];
