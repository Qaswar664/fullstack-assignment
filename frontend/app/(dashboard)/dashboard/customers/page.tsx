'use client';

import { useState, useCallback } from 'react';
import {
  UserPlus, Pencil, Trash2, RotateCcw,
  UserCheck, UserX, Search, Users, ChevronLeft, ChevronRight,
  FileText, Plus, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useCustomers, useCreateCustomer, useUpdateCustomer,
  useDeleteCustomer, useRestoreCustomer, useAssignCustomer,
} from '@/hooks/use-customers';
import { useUsers } from '@/hooks/use-users';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/use-notes';
import { Customer } from '@/types/index';
import { getErrorMessage } from '@/lib/utils';

const UNASSIGN_VALUE = '__unassign__';
const emptyForm = { name: '', email: '', phone: '' };

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const { data, isLoading } = useCustomers(page, 10, search, includeDeleted);
  const { data: users } = useUsers();

  const { mutate: createCustomer, isPending: creating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: updating } = useUpdateCustomer();
  const { mutate: deleteCustomer, isPending: deleting } = useDeleteCustomer();
  const { mutate: restoreCustomer, isPending: restoring } = useRestoreCustomer();
  const { mutate: assignCustomer, isPending: assigning } = useAssignCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [assignTo, setAssignTo] = useState<string>(UNASSIGN_VALUE);
  const [error, setError] = useState('');

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesCustomer, setNotesCustomer] = useState<Customer | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteError, setNoteError] = useState('');

  const { data: notesList, isLoading: notesLoading } = useNotes(
    notesOpen ? notesCustomer?.id ?? null : null,
  );
  const { mutate: addNote, isPending: addingNote } = useCreateNote(notesCustomer?.id ?? '');
  const { mutate: removeNote } = useDeleteNote(notesCustomer?.id ?? '');

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setCreateOpen(true);
  }

  function openEdit(c: Customer) {
    setSelected(c);
    setForm({ name: c.name, email: c.email, phone: c.phone ?? '' });
    setError('');
    setEditOpen(true);
  }

  function openDelete(c: Customer) {
    setSelected(c);
    setError('');
    setDeleteOpen(true);
  }

  function openAssign(c: Customer) {
    setSelected(c);
    setAssignTo(c.assignedToId ?? UNASSIGN_VALUE);
    setError('');
    setAssignOpen(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    createCustomer(
      { name: form.name, email: form.email, phone: form.phone || undefined },
      {
        onSuccess: () => { setCreateOpen(false); setForm(emptyForm); },
        onError: (err) => setError(getErrorMessage(err, 'Failed to create customer')),
      },
    );
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    updateCustomer(
      {
        id: selected.id,
        payload: {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
        },
      },
      {
        onSuccess: () => { setEditOpen(false); setSelected(null); },
        onError: (err) => setError(getErrorMessage(err, 'Failed to update customer')),
      },
    );
  }

  function handleDelete() {
    if (!selected) return;
    deleteCustomer(selected.id, {
      onSuccess: () => { setDeleteOpen(false); setSelected(null); },
      onError: (err) => setError(getErrorMessage(err, 'Failed to delete customer')),
    });
  }

  function handleRestore(c: Customer) {
    restoreCustomer(c.id, {
      onError: (err) => setError(getErrorMessage(err, 'Failed to restore customer')),
    });
  }

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    const resolvedId = assignTo === UNASSIGN_VALUE ? null : assignTo;
    assignCustomer(
      { id: selected.id, assignedToId: resolvedId },
      {
        onSuccess: () => { setAssignOpen(false); setSelected(null); },
        onError: (err) => setError(getErrorMessage(err, 'Failed to assign customer')),
      },
    );
  }

  function openNotes(c: Customer) {
    setNotesCustomer(c);
    setNoteContent('');
    setNoteError('');
    setNotesOpen(true);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteError('');
    addNote(noteContent.trim(), {
      onSuccess: () => setNoteContent(''),
      onError: (err) => setNoteError(getErrorMessage(err, 'Failed to add note')),
    });
  }

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">
            {meta ? `${meta.total} total customers` : 'Manage your customers'}
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white"
          onClick={openCreate}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
        {search && (
          <Button
            variant="outline"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
          >
            Clear
          </Button>
        )}
        <Button
          variant={includeDeleted ? 'default' : 'outline'}
          className={includeDeleted ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-slate-600'}
          onClick={() => { setIncludeDeleted((v) => !v); setPage(1); }}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          {includeDeleted ? 'Hide Deleted' : 'Show Deleted'}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900">No customers found</p>
            <p className="text-sm text-slate-500">
              {search ? 'Try a different search term' : 'Add your first customer'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className={c.deletedAt ? 'opacity-50' : ''}>
                  <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                  <TableCell className="text-slate-600">{c.email}</TableCell>
                  <TableCell className="text-slate-500">{c.phone ?? '—'}</TableCell>
                  <TableCell>
                    {c.assignedTo ? (
                      <span className="text-sm text-slate-700">{c.assignedTo.name}</span>
                    ) : (
                      <span className="text-sm text-slate-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.deletedAt ? (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        Deleted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.deletedAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleRestore(c)}
                          disabled={restoring}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssign(c)}
                            title={c.assignedTo ? 'Reassign' : 'Assign'}
                          >
                            {c.assignedTo
                              ? <UserX className="h-3.5 w-3.5" />
                              : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => openNotes(c)}
                            title="View notes"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => openDelete(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages} — {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jane@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input placeholder="+1234567890" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={creating}>
                {creating ? 'Creating...' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jane@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input placeholder="+1234567890" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={updating}>
                {updating ? 'Updating...' : 'Update Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Customer</DialogTitle></DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">{selected?.name}</span>?
            The customer will be soft-deleted and can be restored later.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesOpen} onOpenChange={(open) => { setNotesOpen(open); if (!open) setNotesCustomer(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Notes — <span className="text-slate-600 font-normal">{notesCustomer?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Add note form */}
          <form onSubmit={handleAddNote} className="flex flex-col gap-2">
            <Textarea
              placeholder="Write a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
            {noteError && <p className="text-sm text-red-600">{noteError}</p>}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white"
                disabled={addingNote || !noteContent.trim()}
              >
                {addingNote
                  ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  : <Plus className="h-4 w-4 mr-1" />}
                Add Note
              </Button>
            </div>
          </form>

          <Separator />

          {/* Notes list */}
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            {notesLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : !notesList?.data.length ? (
              <p className="text-center text-sm text-slate-400 py-6">No notes yet. Add the first one above.</p>
            ) : (
              notesList.data.map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col gap-1">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">
                      {note.createdBy.name} · {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleAssign} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Assign <span className="font-semibold text-slate-900">{selected?.name}</span> to a team member.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>Assign To</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGN_VALUE}>— Unassign —</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={assigning}>
                {assigning ? 'Saving...' : 'Save Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
