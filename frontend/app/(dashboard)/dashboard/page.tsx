'use client';

import { useEffect, useState } from 'react';
import { Users, BarChart3, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@/types/index';
import { useCustomers } from '@/hooks/use-customers';
import { useOrganization } from '@/hooks/use-organization';
import { useActivityLogs } from '@/hooks/use-activity-logs';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      setUser(JSON.parse(stored));
    } catch {
      // ignore corrupt data
    }
  }, []);

  const { data: customersData } = useCustomers(1, 1);
  const { data: org } = useOrganization();
  const { data: logsData } = useActivityLogs(1, 1);

  const totalCustomers = customersData?.meta?.total ?? null;
  const orgName = org?.name ?? null;
  const totalLogs = logsData?.meta?.total ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Here is what is happening in your organization today.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Customers</p>
              <p className="text-xl font-bold text-slate-900">
                {totalCustomers === null ? '—' : totalCustomers}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Organization</p>
              <p className="text-xl font-bold text-slate-900 truncate max-w-[140px]">
                {orgName === null ? '—' : orgName}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Activity Logs</p>
              <p className="text-xl font-bold text-slate-900">
                {totalLogs === null ? '—' : totalLogs}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role info */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="font-semibold text-slate-900 mt-0.5">{user?.email}</p>
          <span className="inline-block mt-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 capitalize">
            {user?.role}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
