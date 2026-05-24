import { queryOptions } from '@tanstack/react-query';
import { getEngagements } from '../api/engagements.api';
import { FETCHENGAGEMENTS } from '../consts/query.consts';

export const engagementQueries = {
  fetchEngagements: () => {
    return queryOptions({
      queryKey: [FETCHENGAGEMENTS],
      queryFn: getEngagements,
    });
  },
};
