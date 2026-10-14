import { alignLocalApiUrl } from '@/config/env';
import { expect, it } from 'vitest';

it('uses the page host for a local API so the session cookie is sent', () => {
  expect(
    alignLocalApiUrl('http://localhost:3000', '127.0.0.1')
  ).toBe('http://127.0.0.1:3000');
  expect(
    alignLocalApiUrl('http://127.0.0.1:3000', 'localhost')
  ).toBe('http://localhost:3000');
});

it('leaves a remote API and an already matching host unchanged', () => {
  expect(
    alignLocalApiUrl('https://api.example.com', '127.0.0.1')
  ).toBe('https://api.example.com');
  expect(
    alignLocalApiUrl('http://127.0.0.1:3000', '127.0.0.1')
  ).toBe('http://127.0.0.1:3000');
});
