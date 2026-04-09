'use client';

import { useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useActivityLogs } from '@/hooks/use-activity-logs';
import { ActionType } from '@/types/index';

const ACTION_COLORS: Record<ActionType, string> = {
  CUSTOMER_CREATED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  CUSTOMER_UPDATED:   'bg-blue-50 text-blue-700 border-blue-200',
  CUSTOMER_DELETED:   'bg-red-50 text-red-600 border-red-200',
  CUSTOMER_RESTORED:  'bg-purple-50 text-purple-700 border-purple-200',
  NOTE_ADDED:         'bg-amber-50 text-amber-700 border-amber-200',
  CUSTOMER_ASSIGNED:  'bg-sky-50 text-sky-700 border-sky-200',
};

const ALL_ACTIONS: ActionType[] = [
  'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED',
  'CUSTOMER_RESTORED', 'NOTE_ADDED', 'CUSTOMER_ASSIGNED',
];

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<ActionType | undefined>(undefined);

  const { data, isLoading, isError } = useActivityLogs(page, 15, undefined, action);

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-500 mt-1">
            {meta ? `${meta.total} total events` : 'Track all actions in your organization'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={action ?? '__all__'}
            onValueChange={(val) => {
              setPage(1);
              setAction(val === '__all__' ? undefined : (val as ActionType));
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All actions</SelectItem>
              {ALL_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="font-medium text-slate-900">Failed to load activity logs</p>
            <p className="text-sm text-slate-500">Please try again later</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <BarChart3 className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900">No activity logs yet</p>
            <p className="text-sm text-slate-500">Actions will appear here as they happen</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600 border-slate-200'}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-700">{log.entityType}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.performedBy.name}</p>
                      <p className="text-xs text-slate-500">{log.performedBy.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
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
    </div>
  );
}
