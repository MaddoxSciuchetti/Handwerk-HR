import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { DocumentMasterList } from '@/features/settings/documents/DocumentMasterList';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

beforeEach(() => vi.clearAllMocks());

const master = {
  id: 'master-1',
  name: 'Arbeitsvertrag_Main',
  kind: 'employment_contract',
  isPrimary: true,
  updatedAt: '2026-10-17',
};

it('selects from the box or its surrounding cell without opening the document', () => {
  const onToggle = vi.fn();
  const { rerender } = render(
    <DocumentMasterList
      masters={[master]}
      selectedIds={[]}
      onToggle={onToggle}
      emptyLabel="Leer"
    />
  );
  const button = screen.getByRole('button', {
    name: `${master.name} auswählen`,
  });
  fireEvent.click(button.querySelector('svg')!);
  expect(onToggle).toHaveBeenCalledExactlyOnceWith(master.id);
  expect(navigate).not.toHaveBeenCalled();

  fireEvent.click(button.closest('td')!);
  expect(onToggle).toHaveBeenCalledTimes(2);
  expect(navigate).not.toHaveBeenCalled();

  rerender(
    <DocumentMasterList
      masters={[master]}
      selectedIds={[master.id]}
      onToggle={onToggle}
      emptyLabel="Leer"
    />
  );
  const selected = screen.getByRole('button', {
    name: `${master.name} aus der Auswahl entfernen`,
  });
  expect(selected).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(selected);
  expect(onToggle).toHaveBeenCalledTimes(3);
  expect(navigate).not.toHaveBeenCalled();

  fireEvent.click(screen.getByText(master.name));
  expect(navigate).toHaveBeenCalledExactlyOnceWith({
    to: '/settings/documents/$id',
    params: { id: master.id },
  });
});
