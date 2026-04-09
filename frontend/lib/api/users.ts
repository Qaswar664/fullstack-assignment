import { api } from '@/lib/axios';
import { ApiResponse, OrgUser, Role } from '@/types/index';

export const getUsers = async (): Promise<OrgUser[]> => {
  const { data } = await api.get<ApiResponse<OrgUser[]>>('/users');
  return data.data;
};

export const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<OrgUser> => {
  const { data } = await api.post<ApiResponse<OrgUser>>('/users', payload);
  return data.data;
};

export const updateUser = async (
  id: string,
  payload: { name?: string; email?: string; role?: Role },
): Promise<OrgUser> => {
  const { data } = await api.patch<ApiResponse<OrgUser>>(`/users/${id}`, payload);
  return data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
