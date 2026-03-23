import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useReducer,
  useState,
} from 'react';
import { modalReducer } from './reducer';
import { TemplateModalContext } from './TaskContext';
import { ModalState } from './types/context.types';
export type TemplateModalContextProps = {
  modalState: ModalState;
  openCreateTask: () => void;
  openEditTask: (
    form_field_id: number,
    description: string,
    owner: string
  ) => void;
  closeTask: () => void;
  tab: 'ONBOARDING' | 'OFFBOARDING';
  setTab: Dispatch<SetStateAction<'ONBOARDING' | 'OFFBOARDING'>>;
};

export function TaskContextProvider({ children }: { children: ReactNode }) {
  const [modalState, dispatch] = useReducer(modalReducer, { kind: 'closed' });
  const [tab, setTab] = useState<'ONBOARDING' | 'OFFBOARDING'>('ONBOARDING');
  const openCreateTask = () => {
    dispatch({ type: 'OPEN_CREATE' });
  };

  const openEditTask = (
    form_field_id: number,
    description: string,
    owner: string
  ) => {
    dispatch({ type: 'OPEN_EDIT', form_field_id, description, owner });
  };

  const closeTask = () => {
    dispatch({ type: 'CLOSE' });
  };

  return (
    <TemplateModalContext.Provider
      value={{
        modalState,
        openCreateTask,
        openEditTask,
        closeTask,
        tab,
        setTab,
      }}
    >
      {children}
    </TemplateModalContext.Provider>
  );
}
