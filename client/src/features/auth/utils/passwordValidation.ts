export const getStrength = (
  password: string,
  progressPercent: number,
  fulfilledRules: number
) => {
  if (password.length === 0) {
    return {
      width: '0%',
      barClass: 'bg-[var(--muted)]',
    };
  }

  if (fulfilledRules <= 2) {
    return {
      width: `${progressPercent}%`,
      barClass: 'bg-[var(--destructive)]',
    };
  }

  if (fulfilledRules < 5) {
    return {
      width: `${progressPercent}%`,
      barClass: 'bg-orange-500',
    };
  }

  return {
    width: '100%',
    barClass: 'bg-green-600',
  };
};
