'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { serviceRequestsApi } from '@/lib/api/service-requests';
import { locationsApi } from '@/lib/api/locations';
import { ServiceRequest } from '@/types/work-order';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export default function PropertyServiceRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  // Fetch location name for header
  const { data: locationData } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationsApi.show(id),
    enabled: !!id,
  });

  // Fetch service requests for this location
  const params: Record<string, string> = { location_id: id };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['service-requests', 'location', id, debouncedSearch],
    queryFn: () => serviceRequestsApi.list(params),
    enabled: !!id,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const locationName = locationData?.data?.name || 'Location';
  const serviceRequests: ServiceRequest[] = data?.data || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Service Requests"
        subtitle={locationName}
        showBack
        backHref={`/properties/${id}`}
        actions={
          <Button size="icon" className="rounded-full" asChild>
            <Link href={`/service-requests/new?location_id=${id}`}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        }
      />

      {/* Search */}
      <div className="border-b border-border bg-background px-4 py-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search service requests..."
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {serviceRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No service requests"
              description={
                debouncedSearch
                  ? 'No results match your search'
                  : 'No service requests have been created for this location'
              }
              action={
                !debouncedSearch ? (
                  <Button asChild>
                    <Link href={`/service-requests/new?location_id=${id}`}>
                      <Plus className="h-4 w-4" />
                      Create Request
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {serviceRequests.map((sr) => (
                <Link
                  key={sr.id}
                  href={`/service-requests/${sr.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {sr.title}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={sr.status} />
                      {sr.priority && (
                        <span
                          className={`flex items-center gap-0.5 text-xs font-medium ${
                            PRIORITY_COLORS[sr.priority] ||
                            'text-muted-foreground'
                          }`}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {sr.priority.charAt(0).toUpperCase() +
                            sr.priority.slice(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {sr.service_request_number}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(sr.created_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
