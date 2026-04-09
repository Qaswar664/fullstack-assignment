'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  UserCircle,
  BarChart3,
  LogOut,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-auth';
import { User } from '@/types/index';

const navItems = [
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: BarChart3 },
];

const adminNavItems = [
  { label: 'Organization', href: '/dashboard/organizations', icon: Building2 },
  { label: 'Users', href: '/dashboard/users', icon: UserCircle },
  { label: 'Deleted Customers', href: '/dashboard/deleted-customers', icon: Trash2 },
];

interface SidebarProps {
  user: User | null;
  onClose?: () => void;
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { mutate: logout } = useLogout();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const allNavItems = [
    ...navItems,
    ...(user?.role === 'admin' ? adminNavItems : []),
  ];

  return (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">CRM System</span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <Separator />

      {/* ── Nav links ── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {allNavItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  active ? 'text-blue-600' : 'text-slate-400',
                )}
              />
              {label}
              {active && (
                <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* ── User info + logout ── */}
      <div className="px-3 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-slate-600"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
