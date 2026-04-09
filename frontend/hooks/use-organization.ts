import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyOrganization,
  createOrganization,
  updateOrganization,
} from '@/lib/api/organizations';

export const ORG_KEY = ['organization'];

export function useOrganization() {
  return useQuery({
    queryKey: ORG_KEY,
    queryFn: getMyOrganization,
    retry: false,
    throwOnError: false,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createOrganization(name),
    onSuccess: (data) => {
      queryClient.setQueryData(ORG_KEY, data);
      // Update user in localStorage with new organizationId
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          user.organizationId = data.id;
          localStorage.setItem('user', JSON.stringify(user));
        } catch {
          // ignore corrupt data
        }
      }
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateOrganization(name),
    onSuccess: (data) => {
      queryClient.setQueryData(ORG_KEY, data);
    },
  });
}
