import { updateEngagement } from './worker.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/services/arbeitszeugnis', () => ({ certificateText: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {
    worker: { findFirst: jest.fn() },
    workerEngagement: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
} }));
const db = prisma as any;
const context = { workerId: 'worker-1', organizationId: 'org-1', engagementId: 'onboarding-1' };
const onboarding = { id: 'onboarding-1', type: 'onboarding', responsibleUserId: 'user-1', createdAt: new Date('2026-10-01') };

beforeEach(() => {
    jest.resetAllMocks();
    db.worker.findFirst.mockResolvedValue({ id: 'worker-1' });
});

it('creates a separate offboarding phase, retaining onboarding tasks and its template receipt', async () => {
    db.workerEngagement.findFirst.mockResolvedValueOnce(onboarding).mockResolvedValueOnce(null);
    db.workerEngagement.create.mockResolvedValue({ id: 'offboarding-1' });
    await expect(updateEngagement({ ...context, type: 'offboarding' })).resolves.toEqual({ id: 'offboarding-1' });
    expect(db.workerEngagement.create).toHaveBeenCalledWith(expect.objectContaining({ data: {
        workerId: 'worker-1', organizationId: 'org-1', responsibleUserId: 'user-1',
        type: 'offboarding', status: 'pending', startDate: undefined, endDate: undefined, completedAt: undefined,
    } }));
    expect(db.workerEngagement.update).not.toHaveBeenCalled();
});

it('reuses the existing offboarding when a type switch is retried', async () => {
    const offboarding = { id: 'offboarding-1', type: 'offboarding', createdAt: new Date('2026-10-02') };
    db.workerEngagement.findFirst.mockResolvedValueOnce(onboarding).mockResolvedValueOnce(offboarding);
    await expect(updateEngagement({ ...context, type: 'offboarding' })).resolves.toEqual(offboarding);
    expect(db.workerEngagement.create).not.toHaveBeenCalled();
    expect(db.workerEngagement.update).not.toHaveBeenCalled();
});

it('still updates an existing offboarding phase in place', async () => {
    db.workerEngagement.findFirst.mockResolvedValue({ ...onboarding, type: 'offboarding' });
    await updateEngagement({ ...context, type: 'offboarding', status: 'in_progress' });
    expect(db.workerEngagement.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'onboarding-1' }, data: { type: 'offboarding', status: 'in_progress' },
    }));
    expect(db.workerEngagement.create).not.toHaveBeenCalled();
});

it('keeps offboarding tasks and receipt attached when returning to Team', async () => {
    const offboarding = { ...onboarding, id: 'offboarding-1', type: 'offboarding' };
    db.workerEngagement.findFirst.mockResolvedValueOnce(offboarding).mockResolvedValueOnce(offboarding);
    db.workerEngagement.create.mockResolvedValue({ id: 'team-1', type: 'transfer' });
    await expect(updateEngagement({ ...context, engagementId: offboarding.id, type: 'transfer' })).resolves.toEqual({ id: 'team-1', type: 'transfer' });
    expect(db.workerEngagement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
        workerId: 'worker-1', type: 'transfer', status: 'completed', responsibleUserId: 'user-1', completedAt: expect.any(Date),
    }) }));
    expect(db.workerEngagement.update).not.toHaveBeenCalled();
});

it('reuses the Team phase when the return request is retried', async () => {
    const offboarding = { ...onboarding, id: 'offboarding-1', type: 'offboarding' };
    const team = { id: 'team-1', type: 'transfer' };
    db.workerEngagement.findFirst.mockResolvedValueOnce(offboarding).mockResolvedValueOnce(team);
    await expect(updateEngagement({ ...context, engagementId: offboarding.id, type: 'transfer' })).resolves.toEqual(team);
    expect(db.workerEngagement.create).not.toHaveBeenCalled();
    expect(db.workerEngagement.update).not.toHaveBeenCalled();
});

it('starts a new offboarding after returning to Team instead of activating older history', async () => {
    const team = { ...onboarding, id: 'team-1', type: 'transfer', createdAt: new Date('2026-10-03') };
    db.workerEngagement.findFirst.mockResolvedValueOnce(team).mockResolvedValueOnce({ id: 'old-offboarding', createdAt: new Date('2026-10-02') });
    db.workerEngagement.create.mockResolvedValue({ id: 'new-offboarding', type: 'offboarding' });
    await expect(updateEngagement({ ...context, engagementId: team.id, type: 'offboarding' })).resolves.toEqual({ id: 'new-offboarding', type: 'offboarding' });
    expect(db.workerEngagement.update).not.toHaveBeenCalled();
});
