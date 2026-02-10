'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { serviceRequestsApi } from '@/lib/api/service-requests';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Box,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
  Wrench,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Supervisor } from '@/types/work-order';

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [plannerNotes, setPlannerNotes] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => serviceRequestsApi.show(id),
    enabled: !!id,
  });

  const sr = data?.data;
  const isWaitingPlanner = sr?.status === 'waiting_planner';

  const { data: supervisorsData, isLoading: supervisorsLoading } = useQuery({
    queryKey: ['available-supervisors', id],
    queryFn: () => serviceRequestsApi.availableSupervisors(id),
    enabled: !!id && isWaitingPlanner,
  });

  const supervisors: Supervisor[] = supervisorsData?.data || [];

  const assignMutation = useMutation({
    mutationFn: (supervisorId: string) => serviceRequestsApi.assignSupervisor(id, supervisorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request', id] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      serviceRequestsApi.approve(id, {
        planner_notes: plannerNotes || undefined,
        allow_off_duty: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request', id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      router.push('/maintenance');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => serviceRequestsApi.reject(id, rejectionReason),
    onSuccess: () => {
      setRejectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      router.push('/maintenance');
    },
  });

  const handleAssignSupervisor = (supervisorId: string) => {
    setSelectedSupervisor(supervisorId);
    assignMutation.mutate(supervisorId);
  };

  if (isLoading) return <PageLoading />;

  if (error || !sr) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Service Request" showBack backHref="/maintenance" />
        <EmptyState
          icon={AlertCircle}
          title="Service request not found"
          description="The service request could not be loaded"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={sr.service_request_number}
        subtitle={sr.title}
        showBack
        backHref="/maintenance"
      />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Status and Priority */}
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={sr.status} />
            {sr.priority && <StatusBadge status={sr.priority} />}
          </div>
        </div>

        {/* SR Details */}
        <div className="border-b border-border bg-card px-4 py-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Details
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="text-sm">{sr.title}</p>
              </div>
            </div>

            {sr.description && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{sr.description}</p>
                </div>
              </div>
            )}

            {sr.failure_description && (
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Failure Description</p>
                  <p className="text-sm whitespace-pre-wrap">{sr.failure_description}</p>
                </div>
              </div>
            )}

            {sr.serviceType && (
              <div className="flex items-start gap-3">
                <Wrench className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Service Type</p>
                  <p className="text-sm">{sr.serviceType.label}</p>
                </div>
              </div>
            )}

            {sr.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm">{sr.location.name}</p>
                </div>
              </div>
            )}

            {sr.asset && (
              <div className="flex items-start gap-3">
                <Box className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Asset</p>
                  <p className="text-sm">{sr.asset.asset_name}</p>
                </div>
              </div>
            )}

            {sr.requester && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Requester</p>
                  <p className="text-sm">{sr.requester.name}</p>
                </div>
              </div>
            )}

            {sr.requested_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Requested Date</p>
                  <p className="text-sm">{formatDateTime(sr.requested_date)}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDateTime(sr.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        {sr.failure_image_urls && sr.failure_image_urls.length > 0 && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images ({sr.failure_image_urls.length})
              </div>
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {sr.failure_image_urls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={url}
                    alt="Service request"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Planner Actions */}
        {isWaitingPlanner && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Planner Review
              </div>
            </h2>

            <div className="space-y-4">
              {/* Supervisor Assignment */}
              <div className="space-y-2">
                <Label>Assign Supervisor</Label>
                {supervisorsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading supervisors...
                  </div>
                ) : supervisors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No supervisors available for this service type.
                  </p>
                ) : (
                  <Select
                    value={selectedSupervisor || sr.assigned_supervisor_id || ''}
                    onValueChange={handleAssignSupervisor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisors.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.staff_name}
                          {sup.current_workload != null && (
                            <span className="text-muted-foreground">
                              {' '}({sup.current_workload} active)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {assignMutation.isSuccess && (
                  <p className="text-xs text-green-600 dark:text-green-400">Supervisor assigned.</p>
                )}
              </div>

              {/* Planner Notes */}
              <div className="space-y-2">
                <Label htmlFor="planner-notes">Notes (optional)</Label>
                <Textarea
                  id="planner-notes"
                  placeholder="Add notes for the work order..."
                  value={plannerNotes}
                  onChange={(e) => setPlannerNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Error messages */}
              {approveMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(approveMutation.error as Error)?.message || 'Failed to approve service request.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Linked Work Orders */}
        {!isWaitingPlanner && (
          <div className="border-b border-border bg-card px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Linked Work Orders
              </div>
            </h2>
            {sr.work_orders && sr.work_orders.length > 0 ? (
              <div className="space-y-2">
                {sr.work_orders.map((wo) => (
                  <div
                    key={wo.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{wo.work_order_number}</p>
                      <p className="text-xs text-muted-foreground">{wo.title}</p>
                    </div>
                    <StatusBadge status={wo.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No work orders linked yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Service Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this service request. This will cancel the request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          {rejectMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(rejectMutation.error as Error)?.message || 'Failed to reject service request.'}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
