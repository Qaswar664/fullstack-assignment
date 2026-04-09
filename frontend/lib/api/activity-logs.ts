import { api } from '@/lib/axios';
import { ApiResponse, PaginatedActivityLogs, ActionType } from '@/types/index';

export async function getActivityLogs(
  page = 1,
  limit = 15,
  customerId?: string,
  action?: ActionType,
): Promise<PaginatedActivityLogs> {
  const params: Record<string, unknown> = { page, limit };
  if (customerId) params.customerId = customerId;
  if (action) params.action = action;
  const { data } = await api.get<ApiResponse<PaginatedActivityLogs>>('/activity-logs', { params });
  return data.data;
}
