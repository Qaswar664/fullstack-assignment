import { api } from '@/lib/axios';
import { ApiResponse, Organization } from '@/types/index';

export const getMyOrganization = async (): Promise<Organization> => {
  const { data } = await api.get<ApiResponse<Organization>>('/organizations/me');
  return data.data;
};

export const createOrganization = async (name: string): Promise<Organization> => {
  const { data } = await api.post<ApiResponse<Organization>>('/organizations', { name });
  return data.data;
};

export const updateOrganization = async (name: string): Promise<Organization> => {
  const { data } = await api.patch<ApiResponse<Organization>>('/organizations/me', { name });
  return data.data;
};
