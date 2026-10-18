type Engagement = {
    status: string; type: string; startedAt: Date; createdAt: Date; completedAt: Date | null; endDate: Date | null;
};
type Worker = { id: string; status: string; engagements: Engagement[] };
type Issue = {
    status: string; startedAt: Date; completedAt: Date | null; createdAt: Date; dueDate: Date | null;
    workerEngagement: { status: string; worker: { status: string } } | null;
};

// Date-only deadlines remain on time throughout their calendar day in Berlin.
function day(date: Date) {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(date);
}
function isLate(completed: Date, deadline: Date | null) {
    return deadline !== null && day(completed) > day(deadline);
}
function duration(samples: { start: Date; end: Date; deadline: Date | null }[]) {
    const valid = samples.filter(({ start, end }) => end >= start);
    const dated = valid.filter(({ deadline }) => deadline !== null);
    return {
        averageMs: valid.length ? valid.reduce((sum, sample) => sum + sample.end.getTime() - sample.start.getTime(), 0) / valid.length : null,
        count: valid.length,
        level: dated.length === 0 ? "neutral" : dated.some(({ end, deadline }) => isLate(end, deadline)) ? "orange" : "green",
    };
}
const open = (status: string) => !["completed", "cancelled"].includes(status);

export function summarizeLifecycleStatistics(workers: Worker[], issues: Issue[], now = new Date()) {
    const activeWorkers = workers.filter(worker => worker.status === "active" && worker.engagements.some(e => open(e.status)));
    const openIssues = issues.filter(issue => !["done", "cancelled"].includes(issue.status) &&
        (!issue.workerEngagement || (issue.workerEngagement.worker.status === "active" && open(issue.workerEngagement.status))));
    const engagements = workers.flatMap(worker => worker.engagements);
    function completedOrRunning(
        completed: { start: Date; end: Date; deadline: Date | null }[],
        running: { start: Date; end: Date; deadline: Date | null }[],
    ) {
        const result = duration(completed);
        if (result.count || !running.length) return result;
        return { ...duration(running), isRunning: true };
    }
    const lifecycleDuration = (type: string) => completedOrRunning(
        engagements.filter(e => e.type === type && e.status === "completed" && e.completedAt)
            .map(e => ({ start: e.startedAt, end: e.completedAt!, deadline: e.endDate })),
        activeWorkers.flatMap(worker => worker.engagements)
            .filter(e => e.type === type && open(e.status))
            .map(e => ({ start: e.startedAt, end: now, deadline: e.endDate })),
    );
    const taskDuration = completedOrRunning(
        issues.filter(issue => issue.status === "done" && issue.completedAt)
            .map(issue => ({ start: issue.startedAt, end: issue.completedAt!, deadline: issue.dueDate })),
        openIssues.map(issue => ({ start: issue.startedAt, end: now, deadline: issue.dueDate })),
    );
    const count = (value: number, overdue: number) => ({ value, overdue, level: overdue ? "orange" : value === 0 ? "green" : "neutral" });
    return {
        openWorkers: count(activeWorkers.length, activeWorkers.filter(worker => worker.engagements.some(e => open(e.status) && isLate(now, e.endDate))).length),
        openTasks: count(openIssues.length, openIssues.filter(issue => isLate(now, issue.dueDate)).length),
        onboarding: lifecycleDuration("onboarding"),
        offboarding: lifecycleDuration("offboarding"),
        taskDuration,
    };
}
