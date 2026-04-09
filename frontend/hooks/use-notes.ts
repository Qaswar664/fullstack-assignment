import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotes, createNote, deleteNote } from '@/lib/api/notes';

const notesKey = (customerId: string) => ['notes', customerId];

export function useNotes(customerId: string | null) {
  return useQuery({
    queryKey: notesKey(customerId ?? ''),
    queryFn: () => getNotes(customerId!),
    enabled: !!customerId,
  });
}

export function useCreateNote(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createNote(customerId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey(customerId) }),
  });
}

export function useDeleteNote(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(customerId, noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey(customerId) }),
  });
}
