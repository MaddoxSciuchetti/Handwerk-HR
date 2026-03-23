export type ModalState =
  | { kind: 'closed' }
  | {
      kind: 'open-create';
    }
  | {
      kind: 'open-edit';
      form_field_id: number;
      description: string;
      owner: string;
    };

export type ModalAction =
  | {
      type: 'OPEN_CREATE';
    }
  | {
      type: 'OPEN_EDIT';
      form_field_id: number;
      description: string;
      owner: string;
    }
  | { type: 'CLOSE' };
