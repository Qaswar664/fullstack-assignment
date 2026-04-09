export type Role = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

// ─── Org Users ───────────────────────────────────────────────────────────────
export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Customers ───────────────────────────────────────────────────────────────
export interface AssignedUser {
  id: string;
  name: string;
  email: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationId: string;
  assignedToId: string | null;
  assignedTo: AssignedUser | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: PaginationMeta;
}

// ─── Notes ────────────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  content: string;
  customerId: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotesList {
  data: Note[];
  total: number;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export type ActionType =
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'CUSTOMER_DELETED'
  | 'CUSTOMER_RESTORED'
  | 'NOTE_ADDED'
  | 'CUSTOMER_ASSIGNED';

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: ActionType;
  organizationId: string;
  customerId: string | null;
  timestamp: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedActivityLogs {
  data: ActivityLog[];
  meta: PaginationMeta;
}

// ─── Organization ─────────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    customers: number;
  };
}
