import { readLicensedMicrosoftUsers } from './welcomeMail';
import { saveEngagementMailRecipients, sendIssueMail } from './engagementMail';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({ prisma: {
    workerEngagement: { findFirst: jest.fn() },
    issue: { findFirst: jest.fn() },
    worker: { findFirst: jest.fn() },
    mailTemplate: { findFirst: jest.fn() },
    engagementMailRecipient: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
} }));
jest.mock('@/services/integrations/runtime', () => ({
    integrationsLive: () => true,
    loadMicrosoft365Config: jest.fn(async () => ({ tenantId: 'tenant' })),
    NOT_LIVE_MESSAGE: 'not live',
}));
jest.mock('@/services/microsoft365Account', () => ({ microsoftGraphToken: jest.fn(async () => 'token') }));
jest.mock('@/constants/env', () => ({ microsoftSimulationEnabled: () => false }));

const licensedUser = { id: 'ada', displayName: 'Ada', mail: 'ada@firma.de', assignedLicenses: [{ skuId: 'sku' }] };
const response = (body: unknown, status = 200) => ({ ok: status === 200, status, text: async () => JSON.stringify(body) }) as Response;

afterEach(() => jest.restoreAllMocks());

it('follows all pages, includes licensed users, and excludes unlicensed or duplicate addresses', async () => {
    const fetcher = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce(response({ value: [licensedUser, { id: 'unlicensed', mail: 'other@firma.de', assignedLicenses: [] }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?$skiptoken=next' }))
        .mockResolvedValueOnce(response({ value: [
            { ...licensedUser, id: 'duplicate', mail: 'ADA@firma.de' },
            { id: 'bob', displayName: 'Bob', userPrincipalName: 'bob@firma.de', assignedLicenses: [{ skuId: 'sku' }] },
        ] }));
    expect(await readLicensedMicrosoftUsers('token')).toEqual([
        { id: 'ada', displayName: 'Ada', email: 'ada@firma.de' },
        { id: 'bob', displayName: 'Bob', email: 'bob@firma.de' },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[0][0])).toContain('assignedLicenses');
});

it('persists the licensed directory identity and address rather than trusting client input', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ value: [licensedUser] }));
    (prisma.workerEngagement.findFirst as jest.Mock).mockResolvedValue({ id: 'engagement' });
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma));
    (prisma.engagementMailRecipient.findMany as jest.Mock).mockResolvedValue([]);
    await saveEngagementMailRecipients({ organizationId: 'org', engagementId: 'engagement', recipients: [
        { kind: 'microsoft_user', microsoftUserId: 'ada', label: 'Forged', address: 'forged@other.de' },
        { kind: 'microsoft_user', microsoftUserId: 'ada', label: 'Duplicate' },
    ] });
    expect(prisma.engagementMailRecipient.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({
        engagementId: 'engagement', kind: 'microsoft_user', microsoftUserId: 'ada', label: 'Ada', address: 'ada@firma.de',
    })] });
});

it('rejects a user who is not in the licensed directory before changing saved recipients', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ value: [] }));
    (prisma.workerEngagement.findFirst as jest.Mock).mockResolvedValue({ id: 'engagement' });
    await expect(saveEngagementMailRecipients({ organizationId: 'org', engagementId: 'engagement', recipients: [
        { kind: 'microsoft_user', microsoftUserId: 'unknown', label: 'Unknown' },
    ] })).rejects.toThrow('Lizenzierter Microsoft-Benutzer nicht gefunden.');
    expect(prisma.engagementMailRecipient.deleteMany).not.toHaveBeenCalled();
});

it.each([true, false])('rechecks current licensing before sending (licensed=%s)', async (licensed) => {
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
        sequence: 'microsoft_send_email', mailTemplateId: 'template', mailSenderAddress: 'office@firma.de',
        workerEngagement: { id: 'engagement', workerId: 'worker' },
    });
    (prisma.worker.findFirst as jest.Mock).mockResolvedValue({ firstName: 'New', lastName: 'Worker' });
    (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue({ subject: 'Welcome', body: 'Hello' });
    (prisma.engagementMailRecipient.findMany as jest.Mock).mockResolvedValue([
        { kind: 'microsoft_user', microsoftUserId: 'ada', label: 'Ada', address: 'old@firma.de' },
    ]);
    const fetcher = jest.spyOn(global, 'fetch').mockResolvedValueOnce(response({ value: licensed ? [licensedUser] : [] }));
    if (licensed) fetcher.mockResolvedValueOnce(new Response(null, { status: 202 }));
    const result = await sendIssueMail({ organizationId: 'org', issueId: 'issue' });
    if (licensed) {
        expect(result).toEqual({ status: 'sent' });
        const sent = JSON.parse(String(fetcher.mock.calls[1][1]?.body));
        expect(sent.message.toRecipients).toEqual([{ emailAddress: { address: 'ada@firma.de' } }]);
    } else {
        expect(result).toMatchObject({ status: 'failed' });
        expect(fetcher).toHaveBeenCalledTimes(1);
    }
});
