import { currentDate } from '../utils/currentDate';

function inputConsts(id: number, form_field_id: number) {
  const InputConfig = [
    {
      type: 'hidden',
      name: 'id',
      value: id,
    },
    {
      type: 'hidden',
      name: 'form_field_id',
      value: form_field_id,
    },
    {
      type: 'hidden',
      name: 'date',
      value: currentDate,
    },
  ];

  return InputConfig;
}

export default inputConsts;
