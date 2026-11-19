import { afterEach, expect, it } from 'vitest';
import {
  clearStagingEnter,
  consumeAuthBounceToLogin,
  markAuthBounceToLogin,
  markStagingEnter,
  wasStagingEnteredRecently,
} from '@/features/auth/stagingSessionGuard';

afterEach(() => {
  sessionStorage.clear();
});

it('only reports a recent staging enter after markStagingEnter', () => {
  expect(wasStagingEnteredRecently()).toBe(false);
  markStagingEnter();
  expect(wasStagingEnteredRecently()).toBe(true);
  clearStagingEnter();
  expect(wasStagingEnteredRecently()).toBe(false);
});

it('consumes the auth bounce flag once', () => {
  expect(consumeAuthBounceToLogin()).toBe(false);
  markAuthBounceToLogin();
  expect(consumeAuthBounceToLogin()).toBe(true);
  expect(consumeAuthBounceToLogin()).toBe(false);
});
