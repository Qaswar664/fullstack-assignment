'use client';

import { useState } from 'react';
import { RotateCcw, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCustomers, useRestoreCustomer, usePermanentDeleteCustomer } from '@/hooks/use-customers';
import { Customer } from '@/types/index';
import { getErrorMessage } from '@/lib/utils';

export default function DeletedCustomersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCustomers(page, 10, undefined, true);

  const { mutate: restore, isPending: restoring } = useRestoreCustomer();
  const { mutate: permanentDelete, isPending: permanentDeleting } = usePermanentDeleteCustomer();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [error, setError] = useState('');

  const customers = (data?.data ?? []).filter((c) => !!c.deletedAt);
  const meta = data?.meta;

  function openConfirmDelete(c: Customer) {
    setSelected(c);
    setError('');
    setConfirmOpen(true);
  }

  function handleRestore(c: Customer) {
    restore(c.id, {
      onError: (err) => setError(getErrorMessage(err, 'Failed to restore customer')),
    });
  }

  function handlePermanentDelete() {
    if (!selected) return;
    setError('');
    permanentDelete(selected.id, {
      onSuccess: () => { setConfirmOpen(false); setSelected(null); },
      onError: (err) => setError(getErrorMessage(err, 'Failed to permanently delete customer')),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Deleted Customers</h1>
        <p className="text-slate-500 mt-1">
          {meta
            ? `${customers.length} deleted customer${customers.length !== 1 ? 's' : ''}`
            : 'Manage soft-deleted customers — restore or permanently remove them'}
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Customers listed here have been soft-deleted. You can <strong>restore</strong> them to make them active again, or <strong>permanently delete</strong> them to remove all their data.
      </div>

      {/* Table */}
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
            <p className="font-medium text-slate-900">No deleted customers</p>
            <p className="text-sm text-slate-500">Soft-deleted customers will appear here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Deleted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className="opacity-75">
                  <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                  <TableCell className="text-slate-600">{c.email}</TableCell>
                  <TableCell className="text-slate-500">{c.phone ?? '—'}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {c.deletedAt ? new Date(c.deletedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      Deleted
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                        onClick={() => handleRestore(c)}
                        disabled={restoring}
                        title="Restore customer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={() => openConfirmDelete(c)}
                        disabled={permanentDeleting}
                        title="Permanently delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete Forever
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages}
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

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Permanently Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-slate-700">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-slate-900">{selected?.name}</span>?
            </p>
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <strong>This cannot be undone.</strong> All notes and activity log entries linked to this customer will also be removed from the database.
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handlePermanentDelete}
              disabled={permanentDeleting}
            >
              {permanentDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
