import { WorkerFixture } from '../types';

export function createWorkerFixture(seed?: string): WorkerFixture {
  const timestamp = Date.now();
  const suffix = seed ? `-${seed}` : '';
  const firstName = 'Onboarding';
  const lastName = `Worker${timestamp}${suffix}`;

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `onboarding-worker-${timestamp}${suffix}@example.com`,
    birthDate: '14.03.1998',
    address: 'Musterstrasse 14',
    entryDate: '14.03.2026',
    position: 'Elektriker',
  };
}
