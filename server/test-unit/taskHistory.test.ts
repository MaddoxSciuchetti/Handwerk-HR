import { prisma } from '@/lib/prisma';
import { updateTaskInOrg, getTaskHistoryInOrg } from '@/services/tasks.service';

jest.mock('@/lib/prisma', () => ({ prisma: {
    issue: { findFirst: jest.fn(), update: jest.fn() },
    issueAuditLog: { create: jest.fn(), findMany: jest.fn() },
    comment: { findMany: jest.fn() },
    issueMention: { updateMany: jest.fn() },
    workerEngagement: { findFirst: jest.fn(), findMany: jest.fn() },
    user: { findMany: jest.fn() },
    $transaction: jest.fn(),
} }));
jest.mock('@/services/questionnaireWorkerProfile', () => ({}));
jest.mock('@/services/arbeitszeugnis', () => ({}));
jest.mock('@/utils/sendMail', () => ({ sendMail: jest.fn() }));

beforeEach(() => {
    jest.resetAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(prisma));
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
        id: 'task', workerEngagementId: 'engagement', title: 'Before',
        status: 'open', assigneeUserId: 'user-1',
    });
    (prisma.issue.update as jest.Mock).mockImplementation(({ data }) => ({ id: 'task', ...data }));
    (prisma.issueAuditLog.create as jest.Mock).mockImplementation(({ data }) => data);
    (prisma.issueAuditLog.findMany as jest.Mock).mockImplementation(() =>
        (prisma.issueAuditLog.create as jest.Mock).mock.calls.map(([{ data }], index) => ({
            ...data, id: `audit-${index}`, createdAt: new Date(),
            actorUser: { id: 'editor', firstName: 'Ada', lastName: 'Test', email: 'ada@test.de', avatarUrl: null },
        })),
    );
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', firstName: 'Old', lastName: 'Owner' },
        { id: 'user-2', firstName: 'New', lastName: 'Owner' },
    ]);
});

it('returns saved task edits in the history with the editor and before/after values', async () => {
    await updateTaskInOrg('org', 'editor', 'task', {
        title: 'After', status: 'done', assigneeUserId: 'user-2',
    });
    const history = await getTaskHistoryInOrg('org', 'task');
    expect(history).toEqual([expect.objectContaining({
        kind: 'audit', action: 'issue.updated', actorUser: expect.objectContaining({ id: 'editor' }),
        changes: expect.arrayContaining([
            { field: 'title', from: 'Before', to: 'After' },
            { field: 'status', from: 'Offen', to: 'Erledigt' },
            { field: 'assigneeUserId', from: 'Old Owner', to: 'New Owner' },
        ]),
    })]);
});

it('clears the mention marker when the tagged person opens the task', async () => {
    await getTaskHistoryInOrg('org', 'task', 'tagged-user');
    expect(prisma.issueMention.updateMany).toHaveBeenCalledWith({
        where: { issueId: 'task', userId: 'tagged-user', seenAt: null },
        data: { seenAt: expect.any(Date) },
    });
});

it('rejects history requests for tasks outside the organization', async () => {
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(getTaskHistoryInOrg('other-org', 'task')).rejects.toThrow('Task not found');
    expect(prisma.issueAuditLog.findMany).not.toHaveBeenCalled();
});

it('does not write an audit entry when saving unchanged values', async () => {
    await updateTaskInOrg('org', 'editor', 'task', {
        title: 'Before', status: 'open', assigneeUserId: 'user-1',
    });
    expect(prisma.issue.update).not.toHaveBeenCalled();
    expect(prisma.issueAuditLog.create).not.toHaveBeenCalled();
});

it('omits unchanged fields from older audit records', async () => {
    (prisma.issueAuditLog.findMany as jest.Mock).mockResolvedValue([{
        id: 'old', action: 'issue.updated', createdAt: new Date(), actorUser: null,
        oldValue: { title: 'Same', status: 'open', assigneeUserId: null, sequence: null },
        newValue: { title: 'Same', status: 'open', assigneeUserId: 'user-2', sequence: null },
    }]);
    const history = await getTaskHistoryInOrg('org', 'task');
    expect(history[0]).toMatchObject({ changes: [{ field: 'assigneeUserId', from: null, to: 'New Owner' }] });
});

it('persists a changed engagement and resolves the before/after names in history', async () => {
    (prisma.workerEngagement.findFirst as jest.Mock).mockResolvedValue({ id: 'new-engagement' });
    (prisma.workerEngagement.findMany as jest.Mock).mockResolvedValue([
        { id: 'engagement', type: 'onboarding', worker: { firstName: 'Old', lastName: 'Worker' } },
        { id: 'new-engagement', type: 'onboarding', worker: { firstName: 'New', lastName: 'Worker' } },
    ]);
    await updateTaskInOrg('org', 'editor', 'task', { workerEngagementId: 'new-engagement' });
    expect(prisma.issue.update).toHaveBeenCalledWith(expect.objectContaining({ data: { workerEngagementId: 'new-engagement' } }));
    const history = await getTaskHistoryInOrg('org', 'task');
    expect(history[0]).toMatchObject({ changes: [{ field: 'workerEngagementId', from: 'Old Worker · onboarding', to: 'New Worker · onboarding' }] });
});


it('shows the automation failure reason alongside the error status', async () => {
    (prisma.issueAuditLog.findMany as jest.Mock).mockResolvedValue([{
        id: 'error', action: 'issue.updated', createdAt: new Date(), actorUser: null,
        oldValue: { status: 'in_progress' },
        newValue: { status: 'error', automationError: 'Keine freie Lizenz.' },
    }]);
    const history = await getTaskHistoryInOrg('org', 'task');
    expect(history[0]).toMatchObject({ changes: expect.arrayContaining([
        { field: 'status', from: 'In Bearbeitung', to: 'Fehler' },
        { field: 'automationError', from: null, to: 'Keine freie Lizenz.' },
    ]) });
});
