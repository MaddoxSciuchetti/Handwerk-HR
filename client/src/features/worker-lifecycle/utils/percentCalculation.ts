export const calculatePercent = (completedTasks: number, total: number) => {
  if (total <= 0) return 'text-[var(--lifecycle-progress-zero-text)]';
  const percent = (completedTasks / total) * 100;
  if (percent < 20) return 'text-[var(--lifecycle-progress-zero-text)]';
  if (percent >= 20 && percent < 100) return 'text-[var(--chart-3)]';
  if (percent === 100) return 'text-[var(--chart-2)]';
  return 'text-[var(--lifecycle-progress-zero-text)]';
};
