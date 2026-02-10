'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ppmApi } from '@/lib/api/ppm';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  MapPin,
  Box,
  FileText,
  User,
  Users,
  Timer,
  Play,
  Square,
  Plus,
  CheckCircle,
  Pause,
  RotateCcw,
  ShieldCheck,
  Star,
  Package,
  ListChecks,
  AlertCircle,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { PpmWorkOrder } from '@/types/ppm';
import { TimeEntry } from '@/types/work-order';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 dark:bg-red-950',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  low: 'text-green-600 bg-green-50 dark:bg-green-950',
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

export default function PpmWorkOrderDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const id = params.id as string;

  // Timer display state
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

  // Form visibility toggles
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [showReworkForm, setShowReworkForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showLogTimeForm, setShowLogTimeForm] = useState(false);

  // Form states
  const [holdReason, setHoldReason] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [verifyRating, setVerifyRating] = useState(5);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [acceptRating, setAcceptRating] = useState(5);
  const [acceptNotes, setAcceptNotes] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [logTimeHours, setLogTimeHours] = useState('');
  const [logTimeNotes, setLogTimeNotes] = useState('');

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['ppm-work-order', id],
    queryFn: () => ppmApi.show(id),
    enabled: !!id,
  });

  const { data: timerData } = useQuery({
    queryKey: ['ppm-timer', id],
    queryFn: () => ppmApi.timerStatus(id),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const { data: reservationsData } = useQuery({
    queryKey: ['ppm-reservations', id],
    queryFn: () => ppmApi.reservations(id),
    enabled: !!id,
  });

  const ppm: PpmWorkOrder | undefined = data?.data;
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

  // Invalidation helper
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ppm-work-order', id] });
    queryClient.invalidateQueries({ queryKey: ['ppm-timer', id] });
    queryClient.invalidateQueries({ queryKey: ['ppm-reservations', id] });
    queryClient.invalidateQueries({ queryKey: ['ppm-work-orders'] });
  }, [queryClient, id]);

  // Mutations
  const startMutation = useMutation({
    mutationFn: () => ppmApi.start(id),
    onSuccess: invalidateAll,
  });

  const holdMutation = useMutation({
    mutationFn: (reason: string) => ppmApi.hold(id, reason),
    onSuccess: () => {
      invalidateAll();
      setShowHoldForm(false);
      setHoldReason('');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => ppmApi.resume(id),
    onSuccess: invalidateAll,
  });

  const completeMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      if (completeNotes) formData.append('completion_notes', completeNotes);
      return ppmApi.complete(id, formData);
    },
    onSuccess: () => {
      invalidateAll();
      setShowCompleteForm(false);
      setCompleteNotes('');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => ppmApi.submit(id),
    onSuccess: invalidateAll,
  });

  const approveMutation = useMutation({
    mutationFn: () => ppmApi.approve(id, {}),
    onSuccess: invalidateAll,
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => ppmApi.reject(id, reason),
    onSuccess: () => {
      invalidateAll();
      setShowRejectForm(false);
      setRejectReason('');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { quality_rating: number; notes?: string }) =>
      ppmApi.verify(id, payload),
    onSuccess: () => {
      invalidateAll();
      setShowVerifyForm(false);
      setVerifyRating(5);
      setVerifyNotes('');
    },
  });

  const acceptWorkMutation = useMutation({
    mutationFn: (payload: { quality_rating: number; notes?: string }) =>
      ppmApi.acceptWork(id, payload),
    onSuccess: () => {
      invalidateAll();
      setShowAcceptForm(false);
      setAcceptRating(5);
      setAcceptNotes('');
    },
  });

  const requireReworkMutation = useMutation({
    mutationFn: (reason: string) => ppmApi.requireRework(id, reason),
    onSuccess: () => {
      invalidateAll();
      setShowReworkForm(false);
      setReworkReason('');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => ppmApi.cancel(id, reason),
    onSuccess: () => {
      invalidateAll();
      setShowCancelForm(false);
      setCancelReason('');
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: () => ppmApi.startTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppm-timer', id] });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: (notes?: string) => ppmApi.stopTimer(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppm-timer', id] });
      invalidateAll();
    },
  });

  const logTimeMutation = useMutation({
    mutationFn: (payload: { hours: number; notes?: string }) =>
      ppmApi.logTime(id, payload),
    onSuccess: () => {
      invalidateAll();
      setShowLogTimeForm(false);
      setLogTimeHours('');
      setLogTimeNotes('');
    },
  });

  const handleLogTime = () => {
    const hours = parseFloat(logTimeHours);
    if (isNaN(hours) || hours <= 0) return;
    logTimeMutation.mutate({ hours, notes: logTimeNotes || undefined });
  };

  if (isLoading) return <PageLoading />;

  if (error || !ppm) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="PPM Work Order" showBack backHref="/maintenance" />
        <EmptyState
          icon={AlertCircle}
          title="PPM work order not found"
          description="The PPM work order could not be loaded"
        />
      </div>
    );
  }

  // Determine which action buttons to show
  const canStart = ['published', 'material_pending', 'requires_rework'].includes(ppm.status);
  const canHold = ppm.status === 'in_progress';
  const canResume = ppm.status === 'on_hold';
  const canComplete = ppm.status === 'in_progress';
  const canSubmit = ppm.status === 'in_progress';
  const canVerify = ppm.status === 'pending_verification' && hasPermission('ppm.verify');
  const canAcceptWork = ppm.status === 'pending_verification' && hasPermission('ppm.accept-work');
  const canRequireRework = ppm.status === 'pending_verification' && hasPermission('ppm.require-rework');
  const canApprove = ppm.status === 'pending_verification' && hasPermission('ppm.approve');
  const canReject = ppm.status === 'pending_verification' && hasPermission('ppm.reject');
  const canCancel = hasPermission('ppm.cancel') && !['completed', 'cancelled'].includes(ppm.status);
  const showTimerControls = ['in_progress', 'published', 'material_pending', 'requires_rework'].includes(ppm.status);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={ppm.ppm_wo_number}
        subtitle={ppm.description || undefined}
        showBack
        backHref="/maintenance"
      />

      <div className="flex-1 overflow-y-auto pb-48">
        {/* Status Bar */}
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={ppm.status} />
            {ppm.priority && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  PRIORITY_COLORS[ppm.priority] || 'bg-gray-100 text-gray-700'
                )}
              >
                {ppm.priority.charAt(0).toUpperCase() + ppm.priority.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* PPM Info */}
        <div className="border-b border-border bg-card px-4 py-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            PPM Work Order Info
          </h2>
          <div className="space-y-3">
            {ppm.description && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{ppm.description}</p>
                </div>
              </div>
            )}
            {ppm.ppmPlan && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">PPM Plan</p>
                  <p className="text-sm">{ppm.ppmPlan.name || ppm.ppmPlan.description || 'Plan'}</p>
                  {ppm.ppmPlan.estimated_duration && (
                    <p className="text-xs text-muted-foreground">
                      Est. duration: {ppm.ppmPlan.estimated_duration}h
                    </p>
                  )}
                </div>
              </div>
            )}
            {ppm.serviceType && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Service Type</p>
                  <p className="text-sm">{ppm.serviceType.label}</p>
                </div>
              </div>
            )}
            {ppm.target_start_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Target Start</p>
                  <p className="text-sm">{formatDateTime(ppm.target_start_date)}</p>
                </div>
              </div>
            )}
            {ppm.target_finish_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Target Finish</p>
                  <p className="text-sm">{formatDateTime(ppm.target_finish_date)}</p>
                </div>
              </div>
            )}
            {ppm.actual_start_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Actual Start</p>
                  <p className="text-sm">{formatDateTime(ppm.actual_start_date)}</p>
                </div>
              </div>
            )}
            {ppm.actual_finish_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Actual Finish</p>
                  <p className="text-sm">{formatDateTime(ppm.actual_finish_date)}</p>
                </div>
              </div>
            )}
            {ppm.total_hours_worked != null && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Hours Worked</p>
                  <p className="text-sm">{ppm.total_hours_worked}h</p>
                </div>
              </div>
            )}
            {ppm.supervisor && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Supervisor</p>
                  <p className="text-sm">{ppm.supervisor.staff_name}</p>
                </div>
              </div>
            )}
            {ppm.primaryCraftsman && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Primary Craftsman</p>
                  <p className="text-sm">{ppm.primaryCraftsman.staff_name}</p>
                </div>
              </div>
            )}
            {ppm.quality_rating != null && (
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
                          star <= (ppm.quality_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {ppm.notes && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{ppm.notes}</p>
                </div>
              </div>
            )}
            {ppm.completion_notes && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Completion Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{ppm.completion_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Asset & Location */}
        {(ppm.asset || ppm.location) && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Asset & Location
            </h2>
            <div className="space-y-3">
              {ppm.asset && (
                <div className="flex items-start gap-3">
                  <Box className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Asset</p>
                    <p className="text-sm">{ppm.asset.asset_name}</p>
                    {ppm.asset.location && (
                      <p className="text-xs text-muted-foreground">{ppm.asset.location.name}</p>
                    )}
                  </div>
                </div>
              )}
              {ppm.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">{ppm.location.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Task Instruction Sheet Sequences */}
        {ppm.taskInstructionSheet && ppm.taskInstructionSheet.sequences && ppm.taskInstructionSheet.sequences.length > 0 && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Task Instructions
                {ppm.taskInstructionSheet.name && (
                  <span className="text-xs font-normal normal-case">
                    ({ppm.taskInstructionSheet.name})
                  </span>
                )}
              </div>
            </h2>
            <div className="space-y-2">
              {ppm.taskInstructionSheet.sequences
                .sort((a, b) => a.step_number - b.step_number)
                .map((seq) => (
                  <div
                    key={seq.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {seq.step_number}
                    </div>
                    <p className="text-sm">{seq.instruction}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Craftsmen */}
        {ppm.craftsmen && ppm.craftsmen.length > 0 && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Craftsmen ({ppm.craftsmen.length})
              </div>
            </h2>
            <div className="space-y-2">
              {ppm.craftsmen.map((staff) => (
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
        <div className="border-b border-border bg-card px-4 py-4">
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
                <Button
                  variant="destructive"
                  onClick={() => stopTimerMutation.mutate(undefined)}
                  disabled={stopTimerMutation.isPending}
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
          )}

          {/* Timer Controls */}
          {!timerStatus?.has_active_timer && showTimerControls && (
            <div className="mb-3 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/10"
                onClick={() => startTimerMutation.mutate()}
                disabled={startTimerMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLogTimeForm(true)}
              >
                <Plus className="h-4 w-4" />
                Log Time
              </Button>
            </div>
          )}

          {/* Log Time Form */}
          {showLogTimeForm && (
            <div className="mb-3 rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Log Time Manually</p>
              <div className="space-y-1.5">
                <Label htmlFor="logTimeHours">Hours</Label>
                <Input
                  id="logTimeHours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="Hours (e.g., 1.5)"
                  value={logTimeHours}
                  onChange={(e) => setLogTimeHours(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="logTimeNotes">Notes</Label>
                <Input
                  id="logTimeNotes"
                  type="text"
                  placeholder="Notes (optional)"
                  value={logTimeNotes}
                  onChange={(e) => setLogTimeNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleLogTime}
                  disabled={logTimeMutation.isPending || !logTimeHours}
                >
                  Log Time
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLogTimeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Time Entries List */}
          {ppm.timeEntries && ppm.timeEntries.length > 0 && (
            <div className="space-y-2">
              {ppm.timeEntries.map((entry: TimeEntry) => (
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

          {(!ppm.timeEntries || ppm.timeEntries.length === 0) && !timerStatus?.has_active_timer && (
            <p className="text-sm text-muted-foreground">No time entries recorded yet</p>
          )}
        </div>

        {/* Warehouse Reservations */}
        {(reservations.length > 0 || (ppm.warehouseReservations && ppm.warehouseReservations.length > 0)) && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Warehouse Reservations
              </div>
            </h2>
            <div className="space-y-2">
              {(reservations.length > 0 ? reservations : ppm.warehouseReservations || []).map((res) => (
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

        {/* Materials Required */}
        {ppm.materials_required && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Materials Required
            </h2>
            <p className="text-sm whitespace-pre-wrap">{ppm.materials_required}</p>
          </div>
        )}

        {/* Attachments */}
        {ppm.attachments && ppm.attachments.length > 0 && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Attachments ({ppm.attachments.length})
            </h2>
            <div className="space-y-2">
              {ppm.attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm text-primary hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-3 safe-bottom">
        <div className="space-y-2">
          {/* Start Action */}
          {canStart && (
            <Button
              className="w-full py-3"
              size="lg"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Play className="h-4 w-4" />
              {startMutation.isPending ? 'Starting...' : 'Start Work'}
            </Button>
          )}

          {/* In Progress Actions: Hold and Complete/Submit */}
          {canHold && !showHoldForm && !showCompleteForm && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                onClick={() => setShowHoldForm(true)}
              >
                <Pause className="h-4 w-4" />
                Hold
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowCompleteForm(true)}
              >
                <CheckCircle className="h-4 w-4" />
                Complete
              </Button>
            </div>
          )}

          {/* Submit (separate from complete) */}
          {canSubmit && !showHoldForm && !showCompleteForm && (
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/5"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          )}

          {/* Hold Form */}
          {showHoldForm && (
            <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 p-3">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Put On Hold</p>
              <div className="space-y-1.5">
                <Label htmlFor="holdReason">Reason for hold</Label>
                <Textarea
                  id="holdReason"
                  placeholder="Reason for hold..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => holdMutation.mutate(holdReason)}
                  disabled={holdMutation.isPending || !holdReason}
                >
                  {holdMutation.isPending ? 'Submitting...' : 'Confirm Hold'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowHoldForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Complete Form */}
          {showCompleteForm && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Complete Work Order</p>
              <div className="space-y-1.5">
                <Label htmlFor="completeNotes">Completion notes</Label>
                <Textarea
                  id="completeNotes"
                  placeholder="Completion notes..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? 'Submitting...' : 'Submit Completion'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Resume Action */}
          {canResume && (
            <Button
              className="w-full py-3"
              size="lg"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              {resumeMutation.isPending ? 'Resuming...' : 'Resume Work'}
            </Button>
          )}

          {/* Pending Verification Actions */}
          {(canVerify || canAcceptWork || canRequireRework) && !showVerifyForm && !showAcceptForm && !showReworkForm && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {canVerify && (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShowVerifyForm(true)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Verify
                  </Button>
                )}
                {canAcceptWork && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setShowAcceptForm(true)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Accept
                  </Button>
                )}
              </div>
              {canRequireRework && (
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                  onClick={() => setShowReworkForm(true)}
                >
                  <RotateCw className="h-4 w-4" />
                  Require Rework
                </Button>
              )}
            </div>
          )}

          {/* Approval Actions */}
          {(canApprove || canReject) && !showRejectForm && !showVerifyForm && !showAcceptForm && !showReworkForm && (
            <div className="flex gap-2">
              {canApprove && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              )}
              {canReject && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowRejectForm(true)}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </Button>
              )}
            </div>
          )}

          {/* Verify Form */}
          {showVerifyForm && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Verify Work Order</p>
              <div>
                <Label className="mb-1">Quality Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setVerifyRating(star)} className="p-0.5">
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
              <div className="space-y-1.5">
                <Label htmlFor="verifyNotes">Verification notes</Label>
                <Textarea
                  id="verifyNotes"
                  placeholder="Verification notes (optional)..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => verifyMutation.mutate({ quality_rating: verifyRating, notes: verifyNotes || undefined })}
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? 'Verifying...' : 'Confirm Verification'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowVerifyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Accept Work Form */}
          {showAcceptForm && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Accept Work</p>
              <div>
                <Label className="mb-1">Quality Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setAcceptRating(star)} className="p-0.5">
                      <Star
                        className={cn(
                          'h-6 w-6',
                          star <= acceptRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acceptNotes">Notes</Label>
                <Textarea
                  id="acceptNotes"
                  placeholder="Notes (optional)..."
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => acceptWorkMutation.mutate({ quality_rating: acceptRating, notes: acceptNotes || undefined })}
                  disabled={acceptWorkMutation.isPending}
                >
                  {acceptWorkMutation.isPending ? 'Accepting...' : 'Confirm Accept'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAcceptForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Require Rework Form */}
          {showReworkForm && (
            <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 p-3">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Require Rework</p>
              <div className="space-y-1.5">
                <Label htmlFor="reworkReason">Reason for rework</Label>
                <Textarea
                  id="reworkReason"
                  placeholder="Reason for rework..."
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => requireReworkMutation.mutate(reworkReason)}
                  disabled={requireReworkMutation.isPending || !reworkReason}
                >
                  {requireReworkMutation.isPending ? 'Submitting...' : 'Confirm Rework'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReworkForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="space-y-3 rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Reject Work Order</p>
              <div className="space-y-1.5">
                <Label htmlFor="rejectReason">Reason for rejection</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => rejectMutation.mutate(rejectReason)}
                  disabled={rejectMutation.isPending || !rejectReason}
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Action */}
          {canCancel && !showCancelForm && (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setShowCancelForm(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancel Work Order
            </Button>
          )}

          {/* Cancel Form */}
          {showCancelForm && (
            <div className="space-y-3 rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Cancel Work Order</p>
              <div className="space-y-1.5">
                <Label htmlFor="cancelReason">Reason for cancellation</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => cancelMutation.mutate(cancelReason)}
                  disabled={cancelMutation.isPending || !cancelReason}
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelForm(false)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
