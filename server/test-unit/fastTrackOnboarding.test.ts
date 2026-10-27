import { startExpectedOnboarding } from '@/services/worker.service';
import { prisma } from '@/lib/prisma';
import { listBsbMailAddresses } from '@/services/engagementMail';

jest.mock('@/lib/prisma', () => ({ prisma: {
    user: { findUnique: jest.fn() },
    worker: { create: jest.fn() },
    workerEngagement: { create: jest.fn() },
    $transaction: jest.fn(),
} }));
jest.mock('@/services/arbeitszeugnis', () => ({ certificateText: jest.fn() }));
jest.mock('@/services/engagementMail', () => ({ listBsbMailAddresses: jest.fn() }));
const params = { organizationId: 'org', createdByUserId: 'user', email: 'ada@example.test' };
beforeEach(() => {
    jest.resetAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'Office@example.test' });
    (listBsbMailAddresses as jest.Mock).mockResolvedValue({ addresses: [{ email: 'office@example.test' }] });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(prisma));
    (prisma.worker.create as jest.Mock).mockResolvedValue({ id: 'worker' });
    (prisma.workerEngagement.create as jest.Mock).mockResolvedValue({ id: 'engagement' });
});
it('saves the signed-in user as the questionnaire sender', async () => {
    await startExpectedOnboarding(params);
    expect(listBsbMailAddresses).toHaveBeenCalledWith('org');
    expect(prisma.workerEngagement.create).toHaveBeenCalledWith({ data: expect.objectContaining({ questionnaireSenderAddress: 'office@example.test' }) });
});
it('rejects a signed-in address that is not an organization mailbox', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'stranger@example.test' });
    await expect(startExpectedOnboarding(params)).rejects.toThrow('Die E-Mail des angemeldeten Benutzers kann nicht als Absender verwendet werden.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
});
