'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  Inbox,
  Building2,
  Package,
  Warehouse,
  Wrench,
  ScanLine,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/properties', icon: Building2, label: 'Properties' },
  { href: '/assets', icon: Package, label: 'Assets' },
  { href: '/scan', icon: ScanLine, label: 'Scan' },
  { href: '/warehouse', icon: Warehouse, label: 'Warehouse' },
  { href: '/maintenance', icon: Wrench, label: 'Maint.' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom navigation */}
      <nav className="safe-bottom border-t border-border bg-white">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
