'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/lib/api/reservations';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SignaturePad } from '@/components/signature/signature-pad';
import { useAuth } from '@/providers/auth-provider';
import { Reservation, ReservationItem } from '@/types/reservation';
import {
  ClipboardList,
  User,
  Calendar,
  Warehouse,
  Package,
  Check,
  X,
  Send,
  FileText,
  Info,
  AlertCircle,
  PenTool,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const reservationId = params.id as string;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showIssuePanel, setShowIssuePanel] = useState(false);
  const [issueQuantities, setIssueQuantities] = useState<Record<string, number>>({});
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const {
    data: reservationData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['warehouse-reservation', reservationId],
    queryFn: () => reservationsApi.show(reservationId),
  });

  const reservation = reservationData?.data;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => reservationsApi.approve(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservation', reservationId] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservations'] });
      setActionError('');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to approve reservation.';
      setActionError(message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => reservationsApi.reject(reservationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservation', reservationId] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservations'] });
      setShowRejectModal(false);
      setRejectReason('');
      setActionError('');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reject reservation.';
      setActionError(message);
    },
  });

  // Issue mutation
  const issueMutation = useMutation({
    mutationFn: (payload: {
      received_by?: string;
      items: Record<string, { issued_quantity: number; remarks?: string }>;
    }) => reservationsApi.issue(reservationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservation', reservationId] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservations'] });
      setShowIssuePanel(false);
      setIssueQuantities({});
      setActionError('');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to issue materials.';
      setActionError(message);
    },
  });

  // Signature mutation
  const signatureMutation = useMutation({
    mutationFn: (base64: string) => reservationsApi.storeSignature(reservationId, base64),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-reservation', reservationId] });
      setShowSignaturePad(false);
      setSignatureData(null);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save signature.';
      setActionError(message);
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleApprove = () => {
    setActionError('');
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }
    setActionError('');
    rejectMutation.mutate(rejectReason);
  };

  const handleStartIssue = () => {
    if (!reservation?.items) return;
    // Pre-fill with requested quantities
    const quantities: Record<string, number> = {};
    reservation.items.forEach((ri: ReservationItem) => {
      const remaining = ri.requested_quantity - ri.issued_quantity;
      quantities[ri.id] = Math.max(0, remaining);
    });
    setIssueQuantities(quantities);
    setShowIssuePanel(true);
  };

  const handleIssue = () => {
    setActionError('');
    const items: Record<string, { issued_quantity: number }> = {};
    for (const [itemId, qty] of Object.entries(issueQuantities)) {
      if (qty > 0) {
        items[itemId] = { issued_quantity: qty };
      }
    }
    if (Object.keys(items).length === 0) {
      setActionError('Please specify at least one item quantity to issue.');
      return;
    }
    issueMutation.mutate({ items });
  };

  const handleSignatureSave = (base64: string) => {
    setSignatureData(base64);
    signatureMutation.mutate(base64);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!reservation) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Reservation Details" showBack />
        <EmptyState
          icon={Info}
          title="Reservation not found"
          description="The requested reservation could not be found."
          action={
            <Button
              onClick={() => router.push('/warehouse/reservations')}
            >
              Back to Reservations
            </Button>
          }
        />
      </div>
    );
  }

  const isPending = reservation.status === 'pending';
  const isApproved = reservation.status === 'approved';
  const isIssued = reservation.status === 'issued';
  const canApprove = isPending && hasPermission('warehouse.reservations.approve');
  const canIssue = isApproved && hasPermission('warehouse.reservations.issue');

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={reservation.reservation_number}
        subtitle="Reservation"
        showBack
        backHref="/warehouse/reservations"
        actions={<StatusBadge status={reservation.status} />}
      />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="space-y-4 p-4">
          {/* Error Banner */}
          {actionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{actionError}</span>
                <button
                  onClick={() => setActionError('')}
                  className="ml-2 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Rejection Reason */}
          {reservation.rejection_reason && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Rejected</p>
                <p className="text-sm text-destructive">{reservation.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Reservation Info Card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold">{reservation.reservation_number}</h2>
                <StatusBadge status={reservation.status} className="mt-1" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Requested By */}
              {reservation.requestedBy && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requested by:</span>
                  <span className="font-medium">{reservation.requestedBy.name}</span>
                </div>
              )}

              {/* Store */}
              {reservation.store && (
                <div className="flex items-center gap-2 text-sm">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Store:</span>
                  <span className="font-medium">{reservation.store.name}</span>
                </div>
              )}

              {/* Requested Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Requested:</span>
                <span className="font-medium">{formatDate(reservation.requested_date)}</span>
              </div>

              {/* Approved Date */}
              {reservation.approved_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Approved:</span>
                  <span className="font-medium">{formatDate(reservation.approved_date)}</span>
                  {reservation.approvedBy && (
                    <span className="text-muted-foreground">by {reservation.approvedBy.name}</span>
                  )}
                </div>
              )}

              {/* Issuance Date */}
              {reservation.issuance_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Issued:</span>
                  <span className="font-medium">{formatDate(reservation.issuance_date)}</span>
                  {reservation.issuedBy && (
                    <span className="text-muted-foreground">by {reservation.issuedBy.name}</span>
                  )}
                </div>
              )}

              {/* Work Order Reference */}
              {reservation.work_order_number && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Work Order:</span>
                  <span className="font-medium">{reservation.work_order_number}</span>
                </div>
              )}

              {/* PPM Reference */}
              {reservation.ppm_work_order_number && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">PPM WO:</span>
                  <span className="font-medium">{reservation.ppm_work_order_number}</span>
                </div>
              )}

              {/* Comments */}
              {reservation.comments && (
                <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Comments</p>
                  <p className="text-sm">{reservation.comments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Materials ({reservation.items?.length || 0})
            </h3>
            <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
              {reservation.items && reservation.items.length > 0 ? (
                reservation.items.map((ri: ReservationItem) => (
                  <div key={ri.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <Package className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ri.item?.name || `Item ${ri.item_id}`}
                        </p>
                        {ri.item?.item_number && (
                          <p className="text-xs text-muted-foreground">{ri.item.item_number}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                          <span className="text-muted-foreground">
                            Requested: <span className="font-medium text-foreground">{ri.requested_quantity}</span>
                          </span>
                          {ri.issued_quantity > 0 && (
                            <span className="text-green-600">
                              Issued: <span className="font-medium">{ri.issued_quantity}</span>
                            </span>
                          )}
                          {ri.returned_quantity > 0 && (
                            <span className="text-blue-600">
                              Returned: <span className="font-medium">{ri.returned_quantity}</span>
                            </span>
                          )}
                        </div>
                        {ri.remarks && (
                          <p className="mt-1 text-xs text-muted-foreground italic">{ri.remarks}</p>
                        )}
                      </div>
                    </div>

                    {/* Issue Quantity Input - shown when issuing */}
                    {showIssuePanel && (
                      <div className="mt-2 ml-12 flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          Issue qty:
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max={ri.requested_quantity - ri.issued_quantity}
                          value={issueQuantities[ri.id] ?? 0}
                          onChange={(e) =>
                            setIssueQuantities((prev) => ({
                              ...prev,
                              [ri.id]: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20 text-center"
                        />
                        <span className="text-xs text-muted-foreground">
                          / {ri.requested_quantity - ri.issued_quantity} remaining
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No materials listed</p>
                </div>
              )}
            </div>
          </div>

          {/* Signature Section (for issued reservations) */}
          {(isIssued || isApproved) && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Receiver Signature
              </h3>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                {signatureData ? (
                  <div className="space-y-2">
                    <img
                      src={signatureData}
                      alt="Signature"
                      className="h-32 w-full rounded-lg border border-border object-contain bg-card"
                    />
                    <p className="text-xs text-green-600 text-center">Signature captured</p>
                  </div>
                ) : showSignaturePad ? (
                  <div>
                    <SignaturePad onSave={handleSignatureSave} />
                    <button
                      onClick={() => setShowSignaturePad(false)}
                      className="mt-2 w-full text-center text-xs text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <PenTool className="h-5 w-5" />
                    Tap to capture signature
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="text-center text-xs text-muted-foreground">
            Created {formatDateTime(reservation.created_at)}
          </div>

          {/* Action Buttons */}
          {(canApprove || canIssue) && (
            <div className="sticky bottom-0 pb-4">
              {/* Approve / Reject Buttons (for pending) */}
              {canApprove && !showIssuePanel && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(true)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4" />
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              )}

              {/* Issue Button (for approved) */}
              {canIssue && !showIssuePanel && (
                <Button
                  onClick={handleStartIssue}
                  className="w-full"
                >
                  <Send className="h-4 w-4" />
                  Issue Materials
                </Button>
              )}

              {/* Issue Confirm/Cancel (when issue panel is open) */}
              {showIssuePanel && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowIssuePanel(false);
                      setIssueQuantities({});
                      setActionError('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleIssue}
                    disabled={issueMutation.isPending}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4" />
                    {issueMutation.isPending ? 'Issuing...' : 'Confirm Issue'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Reject Modal Overlay */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-t-2xl bg-background p-4 safe-bottom animate-in slide-in-from-bottom">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Reject Reservation</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setActionError('');
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {actionError && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <div className="mb-4">
              <Label htmlFor="reject_reason" className="mb-1">
                Reason for rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Please provide a reason..."
                className="resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setActionError('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
