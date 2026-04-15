import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Matches @layer components `typo-*` typography in globals.css (not Tailwind `text-*` font sizes). */
const twMerge = extendTailwindMerge<'design-system-typography'>({
  extend: {
    classGroups: {
      'design-system-typography': [
        'typo-display',
        'typo-h1',
        'typo-h2',
        'typo-h3',
        'typo-h4',
        'typo-h5',
        'typo-h6',
        'typo-body-xl',
        'typo-body-lg',
        'typo-body-base',
        'typo-body-sm',
        'typo-body-xs',
        'ds-label-lg',
        'ds-label-base',
        'ds-label-sm',
        'typo-overline',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SuccessResult<T> = readonly [T, null];

type ErrorResult<E = Error> = readonly [null, E];

type Result<T, E = Error> = SuccessResult<T> | ErrorResult<E>;

export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return [data, null] as const;
  } catch (error) {
    return [null, error as E] as const;
  }
}

export const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
