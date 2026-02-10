import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // General
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',

  // Work Orders
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',

  // Reservations
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  issued: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  partially_returned: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  returned: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',

  // PPM
  generated: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  published: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  material_pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  pending_verification: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  requires_rework: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',

  // Service Requests
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  closed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;
  const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
