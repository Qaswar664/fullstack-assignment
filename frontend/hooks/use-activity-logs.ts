import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '@/lib/api/activity-logs';
import { ActionType } from '@/types/index';

export function useActivityLogs(page: number, limit: number, customerId?: string, action?: ActionType) {
  return useQuery({
    queryKey: ['activity-logs', page, limit, customerId, action],
    queryFn: () => getActivityLogs(page, limit, customerId, action),
  });
}
