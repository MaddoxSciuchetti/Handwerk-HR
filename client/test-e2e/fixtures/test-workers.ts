import { WorkerFixture } from '../types';

export function createWorkerFixture(seed?: string): WorkerFixture {
  const timestamp = Date.now();
  const suffix = seed ? `-${seed}` : '';
  const uniqueSlug =
    `${timestamp}${suffix}`.replace(/\W/g, '') || String(timestamp);
  const firstName = `E2E${uniqueSlug.slice(-24)}`;
  const lastName = `LW${uniqueSlug.slice(-16)}`;

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `worker-${uniqueSlug.slice(-40)}@example.com`,
    birthDate: '14.03.1998',
    address: 'Musterstrasse 14',
    entryDate: '14.03.2026',
    position: 'Elektriker',
  };
}
