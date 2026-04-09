import { api } from '@/lib/axios';
import { ApiResponse, Customer, PaginatedCustomers } from '@/types/index';

export const getCustomers = async (
  page = 1,
  limit = 10,
  search?: string,
  includeDeleted = false,
): Promise<PaginatedCustomers> => {
  const params: Record<string, unknown> = { page, limit };
  if (search?.trim()) params.search = search.trim();
  if (includeDeleted) params.includeDeleted = 'true';
  const { data } = await api.get<ApiResponse<PaginatedCustomers>>('/customers', { params });
  return data.data;
};

export const createCustomer = async (payload: {
  name: string;
  email: string;
  phone?: string;
}): Promise<Customer> => {
  const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
  return data.data;
};

export const updateCustomer = async (
  id: string,
  payload: { name?: string; email?: string; phone?: string | null },
): Promise<Customer> => {
  const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
  return data.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}`);
};

export const restoreCustomer = async (id: string): Promise<Customer> => {
  const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}/restore`);
  return data.data;
};

export const permanentDeleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}/permanent`);
};

export const assignCustomer = async (
  id: string,
  assignedToId: string | null,
): Promise<Customer> => {
  const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}/assign`, {
    assignedToId,
  });
  return data.data;
};
