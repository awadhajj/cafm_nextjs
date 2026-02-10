'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { workOrdersApi } from '@/lib/api/work-orders';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Wrench,
  User,
  Users,
  Clock,
  Calendar,
  FileText,
  Play,
  CheckCircle,
  ShieldCheck,
  XCircle,
  Timer,
  Square,
  Plus,
  Package,
  AlertCircle,
  Star,
  MapPin,
} from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { WorkOrder, TimeEntry } from '@/types/work-order';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
};

function formatElapsedTime(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - start);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const id = params.id as string;

  // Timer display state
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [showLogTimeForm, setShowLogTimeForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRejectCancelForm, setShowRejectCancelForm] = useState(false);

  // Form states
  const [completeHours, setCompleteHours] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [verifyRating, setVerifyRating] = useState(5);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [logTimeHours, setLogTimeHours] = useState('');
  const [logTimeNotes, setLogTimeNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rejectCancelReason, setRejectCancelReason] = useState('');

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => workOrdersApi.show(id),
    enabled: !!id,
  });

  const { data: timerData } = useQuery({
    queryKey: ['work-order-timer', id],
    queryFn: () => workOrdersApi.timerStatus(id),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const { data: reservationsData } = useQuery({
    queryKey: ['work-order-reservations', id],
    queryFn: () => workOrdersApi.reservations(id),
    enabled: !!id,
  });

  const wo: WorkOrder | undefined = data?.data;
  const timerStatus = timerData?.data;
  const reservations = reservationsData?.data || [];

  // Timer tick effect
  useEffect(() => {
    if (!timerStatus?.has_active_timer || !timerStatus.timer) return;
    const interval = setInterval(() => {
      setTimerDisplay(formatElapsedTime(timerStatus.timer!.started_at));
    }, 1000);
    setTimerDisplay(formatElapsedTime(timerStatus.timer.started_at));
    return () => clearInterval(interval);
  }, [timerStatus]);

  // Mutations
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['work-order', id] });
    queryClient.invalidateQueries({ queryKey: ['work-order-timer', id] });
    queryClient.invalidateQueries({ queryKey: ['work-orders'] });
  }, [queryClient, id]);

  const startMutation = useMutation({
    mutationFn: () => workOrdersApi.start(id),
    onSuccess: invalidateAll,
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { actual_hours: number; completion_notes: string }) =>
      workOrdersApi.complete(id, payload),
    onSuccess: () => {
      invalidateAll();
      setShowCompleteForm(false);
      setCompleteHours('');
      setCompleteNotes('');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { verified: boolean; quality_rating: number; verification_notes?: string }) =>
      workOrdersApi.verify(id, payload),
    onSuccess: () => {
      invalidateAll();
      setShowVerifyForm(false);
      setVerifyRating(5);
      setVerifyNotes('');
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: () => workOrdersApi.startTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-timer', id] });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: (notes?: string) => workOrdersApi.stopTimer(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-timer', id] });
      invalidateAll();
    },
  });

  const logTimeMutation = useMutation({
    mutationFn: (payload: { hours: number; notes?: string }) =>
      workOrdersApi.logTime(id, payload),
    onSuccess: () => {
      invalidateAll();
      setShowLogTimeForm(false);
      setLogTimeHours('');
      setLogTimeNotes('');
    },
  });

  const requestCancelMutation = useMutation({
    mutationFn: (reason: string) => workOrdersApi.requestCancellation(id, reason),
    onSuccess: () => {
      invalidateAll();
      setShowCancelForm(false);
      setCancelReason('');
    },
  });

  const approveCancelMutation = useMutation({
    mutationFn: () => workOrdersApi.approveCancellation(id),
    onSuccess: invalidateAll,
  });

  const rejectCancelMutation = useMutation({
    mutationFn: (reason: string) => workOrdersApi.rejectCancellation(id, reason),
    onSuccess: () => {
      invalidateAll();
      setShowRejectCancelForm(false);
      setRejectCancelReason('');
    },
  });

  const handleComplete = () => {
    const hours = parseFloat(completeHours);
    if (isNaN(hours) || hours <= 0) return;
    completeMutation.mutate({ actual_hours: hours, completion_notes: completeNotes });
  };

  const handleVerify = (verified: boolean) => {
    verifyMutation.mutate({ verified, quality_rating: verifyRating, verification_notes: verifyNotes });
  };

  const handleLogTime = () => {
    const hours = parseFloat(logTimeHours);
    if (isNaN(hours) || hours <= 0) return;
    logTimeMutation.mutate({ hours, notes: logTimeNotes || undefined });
  };

  if (isLoading) return <PageLoading />;

  if (error || !wo) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Work Order" showBack backHref="/maintenance" />
        <EmptyState
          icon={AlertCircle}
          title="Work order not found"
          description="The work order could not be loaded"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={wo.work_order_number}
        subtitle={wo.title || wo.description || undefined}
        showBack
        backHref="/maintenance"
      />

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Status Bar */}
        <div className="border-b border-border bg-white px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={wo.status} />
            {wo.priority && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  PRIORITY_COLORS[wo.priority] || 'bg-gray-100 text-gray-700'
                )}
              >
                {wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1)}
              </span>
            )}
            {wo.cancellation_requested && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                Cancellation Requested
              </span>
            )}
          </div>
        </div>

        {/* WO Info */}
        <div className="border-b border-border bg-white px-4 py-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Work Order Info
          </h2>
          <div className="space-y-3">
            {wo.title && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="text-sm">{wo.title}</p>
                </div>
              </div>
            )}
            {wo.description && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{wo.description}</p>
                </div>
              </div>
            )}
            {wo.craft && (
              <div className="flex items-start gap-3">
                <Wrench className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Craft</p>
                  <p className="text-sm">{wo.craft.craft_name}</p>
                </div>
              </div>
            )}
            {wo.supervisor && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Supervisor</p>
                  <p className="text-sm">{wo.supervisor.staff_name}</p>
                </div>
              </div>
            )}
            {wo.teamLead && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Team Lead</p>
                  <p className="text-sm">{wo.teamLead.staff_name}</p>
                </div>
              </div>
            )}
            {wo.estimated_hours && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Hours</p>
                  <p className="text-sm">{wo.estimated_hours}h</p>
                </div>
              </div>
            )}
            {wo.actual_hours != null && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Actual Hours</p>
                  <p className="text-sm">{wo.actual_hours}h</p>
                </div>
              </div>
            )}
            {wo.scheduled_start_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled Start</p>
                  <p className="text-sm">{formatDateTime(wo.scheduled_start_date)}</p>
                </div>
              </div>
            )}
            {wo.scheduled_end_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled End</p>
                  <p className="text-sm">{formatDateTime(wo.scheduled_end_date)}</p>
                </div>
              </div>
            )}
            {wo.completion_notes && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Completion Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{wo.completion_notes}</p>
                </div>
              </div>
            )}
            {wo.quality_rating != null && (
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Quality Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-4 w-4',
                          star <= (wo.quality_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Request Info */}
        {wo.serviceRequest && (
          <div className="border-b border-border bg-white px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Service Request
            </h2>
            <button
              onClick={() => router.push(`/maintenance/service-requests/${wo.serviceRequest!.id}`)}
              className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {wo.serviceRequest.service_request_number}
                </span>
                <StatusBadge status={wo.serviceRequest.status} />
              </div>
              <p className="mt-1 text-sm font-medium">{wo.serviceRequest.title}</p>
              {wo.serviceRequest.location && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {wo.serviceRequest.location.name}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Assigned Staff */}
        {wo.assignedStaff && wo.assignedStaff.length > 0 && (
          <div className="border-b border-border bg-white px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Staff ({wo.assignedStaff.length})
              </div>
            </h2>
            <div className="space-y-2">
              {wo.assignedStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{staff.staff_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {staff.staff_type && <span>{staff.staff_type}</span>}
                      {staff.pivot?.role && <span>- {staff.pivot.role}</span>}
                    </div>
                  </div>
                  {staff.pivot?.hours_worked != null && (
                    <span className="text-xs text-muted-foreground">
                      {staff.pivot.hours_worked}h
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer and Time Entries */}
        <div className="border-b border-border bg-white px-4 py-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Time Tracking
            </div>
          </h2>

          {/* Active Timer */}
          {timerStatus?.has_active_timer && (
            <div className="mb-3 rounded-lg border-2 border-primary bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-primary">Timer Running</p>
                  <p className="text-2xl font-mono font-bold text-primary">{timerDisplay}</p>
                </div>
                <button
                  onClick={() => stopTimerMutation.mutate(undefined)}
                  disabled={stopTimerMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Timer Controls */}
          {!timerStatus?.has_active_timer && (wo.status === 'in_progress' || wo.status === 'assigned') && (
            <div className="mb-3 flex gap-2">
              <button
                onClick={() => startTimerMutation.mutate()}
                disabled={startTimerMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Start Timer
              </button>
              <button
                onClick={() => setShowLogTimeForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <Plus className="h-4 w-4" />
                Log Time
              </button>
            </div>
          )}

          {/* Log Time Form */}
          {showLogTimeForm && (
            <div className="mb-3 rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Log Time Manually</p>
              <input
                type="number"
                step="0.25"
                min="0.25"
                placeholder="Hours (e.g., 1.5)"
                value={logTimeHours}
                onChange={(e) => setLogTimeHours(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={logTimeNotes}
                onChange={(e) => setLogTimeNotes(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleLogTime}
                  disabled={logTimeMutation.isPending || !logTimeHours}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Log Time
                </button>
                <button
                  onClick={() => setShowLogTimeForm(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Time Entries List */}
          {wo.timeEntries && wo.timeEntries.length > 0 && (
            <div className="space-y-2">
              {wo.timeEntries.map((entry: TimeEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.staff?.staff_name || 'Staff'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.started_at)}
                      {entry.ended_at && ` - ${formatDateTime(entry.ended_at)}`}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                    )}
                  </div>
                  {entry.hours != null && (
                    <span className="font-mono text-sm font-medium">{entry.hours}h</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {(!wo.timeEntries || wo.timeEntries.length === 0) && !timerStatus?.has_active_timer && (
            <p className="text-sm text-muted-foreground">No time entries recorded yet</p>
          )}
        </div>

        {/* Reservations / Materials */}
        {reservations.length > 0 && (
          <div className="border-b border-border bg-white px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materials / Reservations ({reservations.length})
              </div>
            </h2>
            <div className="space-y-2">
              {reservations.map((res) => (
                <div key={res.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {res.reservation_number}
                    </span>
                    <StatusBadge status={res.status} />
                  </div>
                  {res.items && res.items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {res.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>{item.item?.name || 'Item'}</span>
                          <span className="text-muted-foreground">
                            Qty: {item.issued_quantity}/{item.requested_quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation Info */}
        {wo.cancellation_requested && wo.cancellation_reason && (
          <div className="border-b border-border bg-white px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-red-600 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancellation Request
              </div>
            </h2>
            <p className="text-sm">{wo.cancellation_reason}</p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white px-4 py-3 safe-bottom">
        <div className="space-y-2">
          {/* Status-based actions */}
          {wo.status === 'assigned' && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {startMutation.isPending ? 'Starting...' : 'Start Work Order'}
            </button>
          )}

          {wo.status === 'in_progress' && !showCompleteForm && (
            <button
              onClick={() => setShowCompleteForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Work Order
            </button>
          )}

          {/* Complete Form */}
          {wo.status === 'in_progress' && showCompleteForm && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Complete Work Order</p>
              <input
                type="number"
                step="0.25"
                min="0.25"
                placeholder="Actual hours worked"
                value={completeHours}
                onChange={(e) => setCompleteHours(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                placeholder="Completion notes..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleComplete}
                  disabled={completeMutation.isPending || !completeHours}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {completeMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {wo.status === 'completed' && hasPermission('work-orders.verify') && !showVerifyForm && (
            <button
              onClick={() => setShowVerifyForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              <ShieldCheck className="h-4 w-4" />
              Verify Work Order
            </button>
          )}

          {/* Verify Form */}
          {wo.status === 'completed' && showVerifyForm && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Verify Work Order</p>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Quality Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setVerifyRating(star)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-6 w-6',
                          star <= verifyRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Verification notes (optional)..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(true)}
                  disabled={verifyMutation.isPending}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleVerify(false)}
                  disabled={verifyMutation.isPending}
                  className="flex-1 rounded-lg bg-red-500 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowVerifyForm(false)}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Cancellation Actions */}
          {wo.cancellation_requested && hasPermission('work-orders.approve-cancellation') && (
            <div className="flex gap-2">
              <button
                onClick={() => approveCancelMutation.mutate()}
                disabled={approveCancelMutation.isPending}
                className="flex-1 rounded-lg bg-red-500 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Approve Cancellation
              </button>
              {!showRejectCancelForm ? (
                <button
                  onClick={() => setShowRejectCancelForm(true)}
                  className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm font-medium"
                >
                  Reject Cancellation
                </button>
              ) : (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Rejection reason"
                    value={rejectCancelReason}
                    onChange={(e) => setRejectCancelReason(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectCancelMutation.mutate(rejectCancelReason)}
                      disabled={rejectCancelMutation.isPending || !rejectCancelReason}
                      className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowRejectCancelForm(false)}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Request Cancellation */}
          {!wo.cancellation_requested &&
            (wo.status === 'assigned' || wo.status === 'in_progress') && (
              <>
                {!showCancelForm ? (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Request Cancellation
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-700">Request Cancellation</p>
                    <textarea
                      placeholder="Reason for cancellation..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => requestCancelMutation.mutate(cancelReason)}
                        disabled={requestCancelMutation.isPending || !cancelReason}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        Submit Request
                      </button>
                      <button
                        onClick={() => setShowCancelForm(false)}
                        className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
