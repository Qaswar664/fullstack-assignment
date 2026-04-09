'use client';

import { useState } from 'react';
import { Building2, Pencil, Users, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useOrganization, useCreateOrganization, useUpdateOrganization } from '@/hooks/use-organization';
import { getErrorMessage } from '@/lib/utils';

export default function OrganizationsPage() {
  const { data: org, isLoading, isError } = useOrganization();
  const { mutate: create, isPending: creating } = useCreateOrganization();
  const { mutate: update, isPending: updating } = useUpdateOrganization();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    create(name, {
      onSuccess: () => {
        setCreateOpen(false);
        setName('');
      },
      onError: (err) => setError(getErrorMessage(err, 'Failed to create organization')),
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    update(name, {
      onSuccess: () => {
        setEditOpen(false);
        setName('');
      },
      onError: (err) => setError(getErrorMessage(err, 'Failed to update organization')),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organization</h1>
          <p className="text-slate-500 mt-1">Manage your organization details</p>
        </div>
        {(isError || (!org && !isLoading)) && (
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => { setName(''); setError(''); setCreateOpen(true); }}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        </div>
      )}

      {/* No org yet */}
      {!isLoading && (isError || !org) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Building2 className="h-7 w-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">No organization yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Create your organization to start managing customers and users.
              </p>
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => { setName(''); setError(''); setCreateOpen(true); }}
            >
              Create Organization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Org details */}
      {org && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-slate-700">
                Organization Details
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setName(org.name); setError(''); setEditOpen(true); }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">
                    Created {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <UserCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Members</p>
                  <p className="font-semibold text-slate-900">{org._count?.users ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Customers</p>
                  <p className="font-semibold text-slate-900">{org._count?.customers ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name">Organization Name</Label>
              <Input
                id="create-name"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g. Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
