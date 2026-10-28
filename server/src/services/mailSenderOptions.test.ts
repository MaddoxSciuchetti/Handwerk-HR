import { listBsbMailAddresses, listMailSenders } from './engagementMail';
import { prisma } from '@/lib/prisma';
import { integrationsMocked } from './integrations/localMock';

jest.mock('@/lib/prisma', () => ({
    prisma: { organizationMember: { findMany: jest.fn() } },
}));
jest.mock('./integrations/localMock', () => ({
    integrationsMocked: jest.fn(() => false),
    mockMailboxes: [{ email: 'demo@example.test', kind: 'mailbox' }],
}));

beforeEach(() => {
    jest.clearAllMocks();
    (prisma.organizationMember.findMany as jest.Mock).mockImplementation(async ({ where }) => {
        const members = [
            { userId: 'self', user: { email: 'self@example.com', firstName: 'Self', lastName: 'User' } },
            { userId: 'teammate', user: { email: 'teammate@example.com', firstName: 'Team', lastName: 'Mate' } },
        ];
        return members.filter((member) => !where.userId || member.userId === where.userId);
    });
});

it.each([false, true])('only offers the signed-in member as an automation sender (mocked=%s)', async (mocked) => {
    (integrationsMocked as jest.Mock).mockReturnValue(mocked);
    const result = await listBsbMailAddresses('org', 'self');
    expect(result.addresses.map((address) => address.email)).toEqual(['self@example.com']);
    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org', userId: 'self', status: 'active' }),
    }));
});

it('only offers the signed-in member in the individual email preview', async () => {
    expect(await listMailSenders('org', 'self')).toEqual([
        { email: 'self@example.com', name: 'Self User' },
    ]);
});

it('does not fall back to teammates when the signed-in member is unavailable', async () => {
    expect((await listBsbMailAddresses('org', 'missing')).addresses).toEqual([]);
    expect(await listMailSenders('org', 'missing')).toEqual([]);
});
