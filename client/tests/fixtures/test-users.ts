import { TestUsers } from '../helpers';

//  * Test user data factory
//  * Creates unique test users per browser and timestamp to avoid conflicts

export function createTestUsers(
  browserName: string,
  timestamp: number
): TestUsers {
  return [
    {
      vorname: 'Emma',
      nachname: 'Schmidt',
      email: `emma.schmidt-${browserName}-${timestamp}@test.com`,
      password: 'maddox',
      confirmpassword: 'maddox',
    },
    {
      vorname: 'Emma',
      nachname: 'Schmidt',
      email: `emma.schmidt-${browserName}-${timestamp}@test.com`,
      password: 'maddox',
      confirmpassword: 'maddox',
    },
    {
      vorname: 'Emma',
      nachname: 'Schmidt',
      email: `emma.schmidt-${browserName}-${timestamp}@test.com`,
      password: 'maddox',
      confirmpassword: 'maddox',
    },
  ];
}
