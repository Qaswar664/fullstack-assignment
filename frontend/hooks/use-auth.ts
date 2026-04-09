import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { loginUser, logoutUser } from '@/lib/api/auth';
import { LoginCredentials } from '@/types/index';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginUser(credentials),
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      localStorage.clear();
      router.push('/login');
    },
  });
}
