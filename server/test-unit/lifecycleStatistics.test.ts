import { summarizeLifecycleStatistics } from '../src/utils/lifecycleStatistics';
const date = (day: string) => new Date(day);
const engagement = (overrides = {}) => ({ status: 'completed', type: 'onboarding', createdAt: date('2026-10-01'), startedAt: date('2026-10-01'), completedAt: date('2026-10-03'), endDate: date('2026-10-03'), ...overrides });
const worker = (engagements = [engagement()]) => ({ id: 'w1', status: 'active', engagements });
const issue = (overrides = {}) => ({ status: 'done', createdAt: date('2026-10-01'), startedAt: date('2026-10-01'), dueDate: date('2026-10-03'), workerEngagement: null, completedAt: date('2026-10-03'), ...overrides });
test('empty data has no invented duration', () => {
    const result = summarizeLifecycleStatistics([], []);
    expect(result.onboarding).toEqual({ averageMs: null, count: 0, level: 'neutral' });
    expect(result.openWorkers.value).toBe(0);
});
test('counts unique active workers and ignores cancelled, completed and archived work', () => {
    const active = worker([engagement({ status: 'pending', completedAt: null }), engagement({ status: 'in_progress' })]);
    const result = summarizeLifecycleStatistics([active, worker(), { ...active, status: 'inactive' }], [issue({ status: 'open' }), issue({ status: 'cancelled' }), issue({ status: 'open', workerEngagement: { status: 'completed', worker: { status: 'active' } } })], date('2026-10-05'));
    expect(result.openWorkers).toEqual({ value: 1, overdue: 1, level: 'orange' });
    expect(result.openTasks.value).toBe(1);
});
test('uses explicit timestamps including archived history and later completions', () => {
    const result = summarizeLifecycleStatistics([{ ...worker(), status: 'inactive' }], [issue({ completedAt: date('2026-10-04') })]);
    expect(result.onboarding).toEqual({ averageMs: 2 * 86400000, count: 1, level: 'green' });
    expect(result.taskDuration).toEqual({ averageMs: 3 * 86400000, count: 1, level: 'orange' });
});
test('keeps deadlines on time throughout the Berlin calendar day and excludes missing timestamps', () => {
    const result = summarizeLifecycleStatistics([worker([engagement({ completedAt: date('2026-10-03T21:59:00Z') })])], [issue({ completedAt: null })]);
    expect(result.onboarding.level).toBe('green');
    expect(result.taskDuration.averageMs).toBeNull();
});

test('uses tracking start and excludes reopened tasks and invalid durations', () => {
    const result = summarizeLifecycleStatistics([], [
        issue({ startedAt: date('2026-10-02') }),
        issue({ status: 'in_progress', completedAt: null }),
        issue({ startedAt: date('2026-10-05') }),
    ]);
    expect(result.taskDuration).toEqual({ averageMs: 86400000, count: 1, level: 'green' });
});

test('shows running elapsed time when no completed measurements exist', () => {
    const result = summarizeLifecycleStatistics(
        [worker([engagement({ status: 'in_progress', completedAt: null })])],
        [issue({ status: 'open', completedAt: null })],
        date('2026-10-04'),
    );
    expect(result.onboarding).toEqual({ averageMs: 3 * 86400000, count: 1, level: 'orange', isRunning: true });
    expect(result.taskDuration).toEqual({ averageMs: 3 * 86400000, count: 1, level: 'orange', isRunning: true });
    expect(result.offboarding.averageMs).toBeNull();
});
