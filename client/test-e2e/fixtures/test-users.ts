import { SignupTestUser } from '../types';

//  * Test user data factory
//  * Creates unique test users per browser and timestamp to avoid conflicts

export function createTestUsers(
  browserName: string,
  timestamp: number
): SignupTestUser[] {
  const baseUser: SignupTestUser = {
    vorname: 'Emma',
    nachname: 'Schmidt',
    email: `emma.schmidt-${browserName}-${timestamp}@test.com`,
    password: 'maddox123!',
    confirmpassword: 'maddox123!',
  };

  return [baseUser, { ...baseUser }, { ...baseUser }];
}
