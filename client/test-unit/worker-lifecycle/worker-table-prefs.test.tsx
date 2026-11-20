import { renderHook, act } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useWorkerTablePrefs } from '@/features/worker-lifecycle/hooks/useWorkerTablePrefs';

const storageKey = (user = 'user-a', org = 'org-a') =>
  `worker-table-prefs:v1:${org}:${user}`;

beforeEach(() => {
  localStorage.clear();
});

it('persists extra columns and sort direction for the current user', () => {
  const { result, rerender } = renderHook(
    ({ userId, orgId }) => useWorkerTablePrefs(userId, orgId),
    { initialProps: { userId: 'user-a', orgId: 'org-a' } }
  );

  act(() => {
    result.current.addExtraColumn('birthday');
  });
  act(() => {
    result.current.toggleColumnSort('birthday');
  });

  expect(JSON.parse(localStorage.getItem(storageKey())!)).toEqual({
    extraColumns: ['birthday'],
    columnSort: { column: 'birthday', direction: 'asc' },
  });

  rerender({ userId: 'user-a', orgId: 'org-a' });
  expect(result.current.extraColumns).toEqual(['birthday']);
  expect(result.current.columnSort).toEqual({
    column: 'birthday',
    direction: 'asc',
  });
});

it('restores saved prefs and keeps accounts isolated', () => {
  localStorage.setItem(
    storageKey('user-a'),
    JSON.stringify({
      extraColumns: ['anniversary', 'entryDate'],
      columnSort: { column: 'name', direction: 'desc' },
    })
  );
  localStorage.setItem(
    storageKey('user-b'),
    JSON.stringify({
      extraColumns: ['birthday'],
      columnSort: null,
    })
  );

  const first = renderHook(() => useWorkerTablePrefs('user-a', 'org-a'));
  expect(first.result.current.extraColumns).toEqual([
    'anniversary',
    'entryDate',
  ]);
  expect(first.result.current.columnSort).toEqual({
    column: 'name',
    direction: 'desc',
  });

  const second = renderHook(() => useWorkerTablePrefs('user-b', 'org-a'));
  expect(second.result.current.extraColumns).toEqual(['birthday']);
  expect(second.result.current.columnSort).toBeNull();
});

it('falls back when stored prefs are invalid', () => {
  localStorage.setItem(storageKey(), '{broken');
  const { result } = renderHook(() => useWorkerTablePrefs('user-a', 'org-a'));
  expect(result.current.extraColumns).toEqual([]);
  expect(result.current.columnSort).toBeNull();
});

it('keeps the saved extra-column order when restoring preferences', () => {
  localStorage.setItem(
    storageKey(),
    JSON.stringify({
      extraColumns: ['entryDate', 'birthday', 'entryDate', 'unknown'],
      columnSort: null,
    })
  );
  const { result } = renderHook(() => useWorkerTablePrefs('user-a', 'org-a'));
  expect(result.current.extraColumns).toEqual(['entryDate', 'birthday']);
});

it('removes an extra column and clears sort when that column was active', () => {
  const { result } = renderHook(() => useWorkerTablePrefs('user-a', 'org-a'));

  act(() => {
    result.current.addExtraColumn('birthday');
  });
  act(() => {
    result.current.addExtraColumn('anniversary');
  });
  act(() => {
    result.current.toggleColumnSort('birthday');
  });
  expect(result.current.extraColumns).toEqual(['birthday', 'anniversary']);
  expect(result.current.columnSort).toEqual({
    column: 'birthday',
    direction: 'asc',
  });

  act(() => {
    result.current.removeExtraColumn('birthday');
  });

  expect(result.current.extraColumns).toEqual(['anniversary']);
  expect(result.current.columnSort).toBeNull();
  expect(JSON.parse(localStorage.getItem(storageKey())!)).toEqual({
    extraColumns: ['anniversary'],
    columnSort: null,
  });
});
