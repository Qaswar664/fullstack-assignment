import { api } from '@/lib/axios';
import { ApiResponse, AuthResponse, LoginCredentials } from '@/types/index';

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>(
    '/auth/login',
    credentials,
  );
  return data.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
};
