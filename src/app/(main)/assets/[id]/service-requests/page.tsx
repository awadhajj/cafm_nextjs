'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceRequestsApi } from '@/lib/api/service-requests';
import { assetsApi } from '@/lib/api/assets';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, MapPin, Calendar } from 'lucide-react';
import { ServiceRequest } from '@/types/work-order';
import { formatDate } from '@/lib/utils';

export default function AssetServiceRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: assetData } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.show(id),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['service-requests', 'asset', id],
    queryFn: () => serviceRequestsApi.list({ asset_id: id }),
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const asset = assetData?.data;
  const serviceRequests = data?.data || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Service Requests"
        subtitle={asset?.asset_name}
        showBack
        backHref={`/assets/${id}`}
        actions={
          <Button
            size="icon"
            onClick={() =>
              router.push(
                `/service-requests/new?asset_id=${id}&asset_name=${encodeURIComponent(asset?.asset_name || '')}`
              )
            }
            className="h-9 w-9 rounded-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {serviceRequests.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No service requests"
              description="No service requests have been created for this asset"
              action={
                <Button
                  onClick={() =>
                    router.push(
                      `/service-requests/new?asset_id=${id}&asset_name=${encodeURIComponent(asset?.asset_name || '')}`
                    )
                  }
                >
                  Create Service Request
                </Button>
              }
            />
          ) : (
            <div className="space-y-2 px-4 py-3">
              {serviceRequests.map((sr: ServiceRequest) => (
                <button
                  key={sr.id}
                  onClick={() => router.push(`/service-requests/${sr.id}`)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{sr.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {sr.service_request_number}
                        </p>
                      </div>
                      <StatusBadge status={sr.status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      {sr.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{sr.location.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(sr.created_at)}</span>
                      </div>
                    </div>
                    {sr.failure_description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                        {sr.failure_description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
