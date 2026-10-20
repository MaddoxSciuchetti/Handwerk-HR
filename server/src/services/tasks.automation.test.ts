import { prisma } from '@/lib/prisma';
import { createTaskInOrg, updateTaskInOrg } from './tasks.service';
import { createIssue, updateIssue } from './worker.service';

jest.mock('@/services/worker.service', () => ({ createIssue: jest.fn(), updateIssue: jest.fn() }));
jest.mock('@/utils/sendMail', () => ({ sendMail: jest.fn() }));
jest.mock('@/constants/env', () => ({ APP_ORIGIN: 'https://app.example' }));
jest.mock('@/lib/prisma', () => ({ prisma: {
    workerEngagement: { findFirst: jest.fn() },
    issue: { findFirst: jest.fn() },
    organizationIntegration: { findUnique: jest.fn() },
    mailTemplate: { findFirst: jest.fn() },
} }));

const payload = { title: 'Automation', workerEngagementId: 'engagement-1', sequence: 'microsoft_deactivate_account' };

beforeEach(() => {
    jest.resetAllMocks();
    (prisma.workerEngagement.findFirst as jest.Mock).mockResolvedValue({ id: 'engagement-1' });
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue({ id: 'task-1', workerEngagementId: 'engagement-1' });
    (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue({ enabled: true });
    (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue({ id: 'mail-1' });
});

it.each([
    ['microsoft_deactivate_account', 'microsoft_graph'],
    ['microsoft_create_account', 'microsoft_graph'],
    ['crewmeister_create_account', 'crewmeister'],
])('creates a task with %s and its provider', async (sequence, integrationProvider) => {
    await createTaskInOrg('org-1', 'user-1', { ...payload, sequence });
    expect(createIssue).toHaveBeenCalledWith(expect.objectContaining({ sequence, integrationProvider, mailTemplateId: null, automation: null }));
});

it('stores an email template scoped to the task organization', async () => {
    await createTaskInOrg('org-1', 'user-1', {
        ...payload,
        sequence: 'microsoft_send_email',
        mailTemplateId: 'mail-1',
        mailSenderAddress: 'absender@firma.de',
    });
    expect(prisma.mailTemplate.findFirst).toHaveBeenCalledWith({ where: { id: 'mail-1', organizationId: 'org-1' }, select: { id: true } });
    expect(createIssue).toHaveBeenCalledWith(expect.objectContaining({
        sequence: 'microsoft_send_email',
        mailTemplateId: 'mail-1',
        mailSenderAddress: 'absender@firma.de',
    }));
});

it('rejects email automation without a Microsoft sender', async () => {
    await expect(createTaskInOrg('org-1', 'user-1', {
        ...payload,
        sequence: 'microsoft_send_email',
        mailTemplateId: 'mail-1',
    })).rejects.toThrow('Bitte wähle einen Absender.');
    expect(createIssue).not.toHaveBeenCalled();
});

it('rejects missing or foreign email templates', async () => {
    await expect(createTaskInOrg('org-1', 'user-1', { ...payload, sequence: 'microsoft_send_email' })).rejects.toThrow('Bitte wähle eine E-Mail-Vorlage.');
    (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(createTaskInOrg('org-1', 'user-1', { ...payload, sequence: 'microsoft_send_email', mailTemplateId: 'foreign' })).rejects.toThrow('Die E-Mail-Vorlage wurde nicht gefunden.');
    expect(createIssue).not.toHaveBeenCalled();
});

it('rejects unknown functions and disabled integrations', async () => {
    await expect(createTaskInOrg('org-1', 'user-1', { ...payload, sequence: 'unknown' })).rejects.toThrow('Ungültige Automation.');
    (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue({ enabled: false });
    await expect(createTaskInOrg('org-1', 'user-1', payload)).rejects.toThrow('Diese Integration ist nicht aktiv.');
    expect(createIssue).not.toHaveBeenCalled();
});

it('updates and removes an automation and its email template together', async () => {
    await updateTaskInOrg('org-1', 'user-1', 'task-1', payload);
    expect(updateIssue).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 'microsoft_deactivate_account', integrationProvider: 'microsoft_graph', mailTemplateId: null }));
    await updateTaskInOrg('org-1', 'user-1', 'task-1', { sequence: 'none' });
    expect(updateIssue).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: null, integrationProvider: null, mailTemplateId: null }));
});

it('preserves automations for callers that omit the selection', async () => {
    await updateTaskInOrg('org-1', 'user-1', 'task-1', { title: 'Renamed' });
    expect(updateIssue).toHaveBeenCalledWith(expect.not.objectContaining({ sequence: expect.anything() }));
});

const microsoftId = '12345678-1234-1234-1234-123456789abc';

it('saves a manually entered Microsoft ID when creating and updating deactivation tasks', async () => {
    await createTaskInOrg('org-1', 'user-1', { ...payload, microsoftAccountId: `  ${microsoftId}  ` });
    expect(createIssue).toHaveBeenCalledWith(expect.objectContaining({ microsoftAccountId: microsoftId }));
    await updateTaskInOrg('org-1', 'user-1', 'task-1', { ...payload, microsoftAccountId: microsoftId });
    expect(updateIssue).toHaveBeenCalledWith(expect.objectContaining({ microsoftAccountId: microsoftId }));
});

it('allows an empty optional ID and clears the task override', async () => {
    await updateTaskInOrg('org-1', 'user-1', 'task-1', { ...payload, microsoftAccountId: '   ' });
    expect(updateIssue).toHaveBeenCalledWith(expect.objectContaining({ microsoftAccountId: null }));
});

it('rejects an email address instead of a Microsoft ID', async () => {
    await expect(createTaskInOrg('org-1', 'user-1', { ...payload, microsoftAccountId: 'worker@example.com' }))
        .rejects.toThrow('Bitte gib eine gültige Microsoft-Konto-ID ein.');
    expect(createIssue).not.toHaveBeenCalled();
});
