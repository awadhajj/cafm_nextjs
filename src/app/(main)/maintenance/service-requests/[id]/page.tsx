'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { serviceRequestsApi } from '@/lib/api/service-requests';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  MapPin,
  Box,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => serviceRequestsApi.show(id),
    enabled: !!id,
  });

  const sr = data?.data;

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

      <div className="flex-1 overflow-y-auto">
        {/* Status and Priority */}
        <div className="border-b border-border bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={sr.status} />
            {sr.priority && <StatusBadge status={sr.priority} />}
          </div>
        </div>

        {/* SR Details */}
        <div className="border-b border-border bg-white px-4 py-4">
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

            {sr.failure_description && (
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
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
        {sr.images && sr.images.length > 0 && (
          <div className="border-b border-border bg-white px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images ({sr.images.length})
              </div>
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {sr.images.map((img) => (
                <a
                  key={img.id}
                  href={img.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={img.image_url}
                    alt="Service request"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Linked Work Orders - navigational section */}
        <div className="border-b border-border bg-white px-4 py-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Linked Work Orders
            </div>
          </h2>
          <p className="text-sm text-muted-foreground">
            Work orders linked to this service request can be found in the Work Orders tab.
          </p>
          <button
            onClick={() => router.push('/maintenance')}
            className="mt-2 text-sm font-medium text-primary"
          >
            View Work Orders
          </button>
        </div>
      </div>
    </div>
  );
}
