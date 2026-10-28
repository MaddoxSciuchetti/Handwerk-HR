import { startExpectedOnboarding } from '@/services/worker.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({ prisma: {
    user: { findUnique: jest.fn() },
    worker: { create: jest.fn() },
    workerEngagement: { create: jest.fn() },
    $transaction: jest.fn(),
} }));
jest.mock('@/services/arbeitszeugnis', () => ({ certificateText: jest.fn() }));
const params = { organizationId: 'org', createdByUserId: 'user', email: 'ada@example.test' };
beforeEach(() => {
    jest.resetAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'Office@example.test' });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(prisma));
    (prisma.worker.create as jest.Mock).mockResolvedValue({ id: 'worker' });
    (prisma.workerEngagement.create as jest.Mock).mockResolvedValue({ id: 'engagement' });
});
it('uses the authenticated user email and ignores a supplied sender', async () => {
    await startExpectedOnboarding({ ...params, senderAddress: 'stranger@example.test' } as typeof params);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user' }, select: { email: true } });
    expect(prisma.workerEngagement.create).toHaveBeenCalledWith({ data: expect.objectContaining({ questionnaireSenderAddress: 'office@example.test' }) });
});
it('rejects onboarding if the authenticated user cannot be found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(startExpectedOnboarding(params)).rejects.toThrow('Die E-Mail-Adresse des angemeldeten Nutzers fehlt.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
});
