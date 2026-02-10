import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // General
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',

  // Work Orders
  pending: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  on_hold: 'bg-orange-100 text-orange-700',

  // Reservations
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  issued: 'bg-green-100 text-green-700',
  partially_returned: 'bg-orange-100 text-orange-700',
  returned: 'bg-cyan-100 text-cyan-700',

  // PPM
  generated: 'bg-gray-100 text-gray-700',
  published: 'bg-blue-100 text-blue-700',
  material_pending: 'bg-yellow-100 text-yellow-700',
  pending_verification: 'bg-purple-100 text-purple-700',
  requires_rework: 'bg-orange-100 text-orange-700',

  // Service Requests
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-blue-100 text-blue-700',
  closed: 'bg-green-100 text-green-700',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;
  const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
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
