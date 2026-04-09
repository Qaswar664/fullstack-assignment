import { api } from '@/lib/axios';
import { ApiResponse, Note, NotesList } from '@/types/index';

export async function getNotes(customerId: string): Promise<NotesList> {
  const { data } = await api.get<ApiResponse<NotesList>>(
    `/customers/${customerId}/notes`,
  );
  return data.data;
}

export async function createNote(customerId: string, content: string): Promise<Note> {
  const { data } = await api.post<ApiResponse<Note>>(
    `/customers/${customerId}/notes`,
    { content },
  );
  return data.data;
}

export async function deleteNote(customerId: string, noteId: string): Promise<void> {
  await api.delete(`/customers/${customerId}/notes/${noteId}`);
}
