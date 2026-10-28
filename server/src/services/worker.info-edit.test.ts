import { updateWorker } from './worker.service';
import { prisma } from '@/lib/prisma';

jest.mock('@/services/arbeitszeugnis', () => ({ certificateText: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {
    worker: { findFirst: jest.fn(), update: jest.fn() },
    workerWorkwear: { findFirst: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
} }));
const db = prisma as any;
const context = { workerId: 'worker-1', organizationId: 'org-1' };
beforeEach(() => {
    jest.clearAllMocks();
    db.worker.findFirst.mockResolvedValue({ id: 'worker-1' });
    db.workerWorkwear.findFirst.mockResolvedValue(null);
    db.$transaction.mockImplementation((run: any) => run(db));
});

it('updates profile details within the owned worker', async () => {
    await updateWorker({ ...context, updateData: { firstName: 'Ada', postalCode: '01234', birthday: '1990-03-12T00:00:00.000Z', exitDate: null } });
    expect(db.worker.findFirst).toHaveBeenCalledWith({ where: { id: 'worker-1', organizationId: 'org-1' } });
    expect(db.worker.update).toHaveBeenCalledWith({ where: { id: 'worker-1' }, data: { firstName: 'Ada', postalCode: '01234', birthday: '1990-03-12T00:00:00.000Z', exitDate: null } });
});
it('adds a previously missing clothing size', async () => {
    await updateWorker({ ...context, updateData: { workwearSize: { itemName: 'Hose', size: ' M ' } } });
    expect(db.workerWorkwear.create).toHaveBeenCalledWith({ data: { workerId: 'worker-1', itemName: 'Hose', size: 'M', articleNumber: '', quantity: 1 } });
    expect(db.worker.update).toHaveBeenCalledWith({ where: { id: 'worker-1' }, data: {} });
});
it('changes only size while preserving existing article numbers and quantities', async () => {
    db.workerWorkwear.findFirst.mockResolvedValue({ id: 'size-1' });
    await updateWorker({ ...context, updateData: { workwearSize: { itemName: 'T-Shirt', size: 'XL' } } });
    expect(db.workerWorkwear.updateMany).toHaveBeenCalledWith({ where: { workerId: 'worker-1', itemName: 'T-Shirt' }, data: { size: 'XL' } });
    expect(db.workerWorkwear.create).not.toHaveBeenCalled();
});
it('clears an existing size without deleting its clothing record', async () => {
    db.workerWorkwear.findFirst.mockResolvedValue({ id: 'size-1' });
    await updateWorker({ ...context, updateData: { workwearSize: { itemName: 'Hose', size: '' } } });
    expect(db.workerWorkwear.updateMany).toHaveBeenCalledWith({ where: { workerId: 'worker-1', itemName: 'Hose' }, data: { size: '' } });
});
it('rejects updates to a worker outside the organization', async () => {
    db.worker.findFirst.mockResolvedValue(null);
    await expect(updateWorker({ ...context, updateData: { workwearSize: { itemName: 'Hose', size: 'M' } } })).rejects.toThrow('access denied');
    expect(db.$transaction).not.toHaveBeenCalled();
});
