import { pingMicrosoftLicenseAdmin } from './licensePing';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/utils/sendMail';
import { microsoft365LicenseAvailability } from './licenses';

jest.mock('@/lib/prisma', () => ({ prisma: {
    workerEngagement: { findFirst: jest.fn() },
    organizationMember: { findMany: jest.fn() },
} }));
jest.mock('@/utils/sendMail', () => ({ sendMail: jest.fn() }));
jest.mock('./licenses', () => ({ microsoft365LicenseAvailability: jest.fn() }));
const engagement = jest.mocked(prisma.workerEngagement.findFirst);
const admins = jest.mocked(prisma.organizationMember.findMany);
const licenses = jest.mocked(microsoft365LicenseAvailability);
const mail = jest.mocked(sendMail);
beforeEach(() => {
    engagement.mockResolvedValue({ worker: { firstName: 'Anna <Test>', lastName: 'Müller' } } as any);
    admins.mockResolvedValue([{ user: { email: 'admin@example.com' } }] as any);
    licenses.mockResolvedValue({ available: 0, occupied: 10, skuPartNumber: "BUSINESS", error: null });
    mail.mockResolvedValue({ data: { id: 'sent' }, error: null });
});
it('sends the current worker and engagement to active organization admins', async () => {
    await pingMicrosoftLicenseAdmin('org', 'engagement');
    expect(engagement).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'engagement', organizationId: 'org', worker: { organizationId: 'org' } },
    }));
    expect(admins).toHaveBeenCalledWith(expect.objectContaining({ where: {
        organizationId: 'org', membershipRole: 'admin', status: 'active', user: { status: 'active' },
    } }));
    expect(mail).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'org', to: 'admin@example.com',
        text: expect.stringContaining('Anna <Test> Müller'),
        html: expect.stringContaining('Anna &lt;Test&gt; Müller'),
    }));
    expect(mail.mock.calls[0][0].text).toContain('Engagement: engagement');
});
it('rejects engagements outside the current organization before sending', async () => {
    engagement.mockResolvedValue(null);
    await expect(pingMicrosoftLicenseAdmin('org', 'foreign')).rejects.toThrow('Engagement nicht gefunden');
    expect(licenses).not.toHaveBeenCalled();
    expect(mail).not.toHaveBeenCalled();
});
it.each([
    { available: 2, occupied: 8, skuPartNumber: "BUSINESS", error: null },
    { available: null, error: 'Microsoft ist nicht erreichbar.' },
])('does not send when availability is not confirmed as zero: %j', async (result) => {
    licenses.mockResolvedValue(result as Awaited<ReturnType<typeof microsoft365LicenseAvailability>>);
    await expect(pingMicrosoftLicenseAdmin('org', 'engagement')).rejects.toThrow();
    expect(mail).not.toHaveBeenCalled();
});
it('reports missing administrators', async () => {
    admins.mockResolvedValue([]);
    await expect(pingMicrosoftLicenseAdmin('org', 'engagement')).rejects.toThrow('Keine Administration');
    expect(mail).not.toHaveBeenCalled();
});
it('reports delivery failures', async () => {
    mail.mockResolvedValue({ data: null, error: { name: 'MailError', message: 'offline' } });
    await expect(pingMicrosoftLicenseAdmin('org', 'engagement')).rejects.toThrow('E-Mail konnte nicht');
});
