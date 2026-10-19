import { startExpectedOnboarding } from '@/services/worker.service';
import { prisma } from '@/lib/prisma';
import { listBsbMailAddresses } from '@/services/engagementMail';

jest.mock('@/lib/prisma', () => ({ prisma: {
    worker: { create: jest.fn() },
    workerEngagement: { create: jest.fn() },
    $transaction: jest.fn(),
} }));
jest.mock('@/services/arbeitszeugnis', () => ({ certificateText: jest.fn() }));
jest.mock('@/services/engagementMail', () => ({ listBsbMailAddresses: jest.fn() }));
const params = { organizationId: 'org', createdByUserId: 'user', email: 'ada@example.test', senderAddress: 'Office@example.test' };
beforeEach(() => {
    jest.resetAllMocks();
    (listBsbMailAddresses as jest.Mock).mockResolvedValue({ addresses: [{ email: 'office@example.test' }] });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(prisma));
    (prisma.worker.create as jest.Mock).mockResolvedValue({ id: 'worker' });
    (prisma.workerEngagement.create as jest.Mock).mockResolvedValue({ id: 'engagement' });
});
it('saves the selected organization sender with the draft', async () => {
    await startExpectedOnboarding(params);
    expect(listBsbMailAddresses).toHaveBeenCalledWith('org');
    expect(prisma.workerEngagement.create).toHaveBeenCalledWith({ data: expect.objectContaining({ questionnaireSenderAddress: 'office@example.test' }) });
});
it('rejects an unavailable sender before creating a worker', async () => {
    await expect(startExpectedOnboarding({ ...params, senderAddress: 'stranger@example.test' })).rejects.toThrow('Bitte einen gültigen Absender wählen.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
});
