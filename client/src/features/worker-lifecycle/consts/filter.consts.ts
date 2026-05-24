import { DropdownOption } from '@/components/ui/nested-dropdown';

const SORT_SUB_OPTIONS: DropdownOption[] = [
  { label: 'Neueste zuerst', value: 'desc' },
  { label: 'Älteste zuerst', value: 'asc' },
];

export const FILTER_OPTIONS: DropdownOption[] = [
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
