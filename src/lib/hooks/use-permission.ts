'use client';

import { useAuth } from '@/providers/auth-provider';

export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function usePermissions(permissions: string[]): Record<string, boolean> {
  const { hasPermission } = useAuth();
  const result: Record<string, boolean> = {};
  for (const perm of permissions) {
    result[perm] = hasPermission(perm);
  }
  return result;
}
