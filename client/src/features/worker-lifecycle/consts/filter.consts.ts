import { DropdownOption } from '@/components/ui/nested-dropdown';
import { ENGAGEMENT_TYPE_OPTIONS } from './engagement-type.consts';

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
    subOptions: ENGAGEMENT_TYPE_OPTIONS,
  },
];
