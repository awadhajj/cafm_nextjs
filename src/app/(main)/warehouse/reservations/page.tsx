'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { reservationsApi } from '@/lib/api/reservations';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { Reservation } from '@/types/reservation';
import {
  ClipboardList,
  Plus,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'issued', label: 'Issued' },
];

export default function ReservationsListPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { hasPermission } = useAuth();

  const {
    data: reservationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['warehouse-reservations', activeTab, search],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search) params.search = search;
      return reservationsApi.list(params);
    },
  });

  const reservations = reservationsData?.data || [];

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Reservations"
        showBack
        backHref="/warehouse"
        actions={
          hasPermission('warehouse.reservations.create') ? (
            <Button
              onClick={() => router.push('/warehouse/reservations/new')}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
              {tab.key === 'all' && reservationsData?.pagination?.total !== undefined && (
                <span className="ml-1 text-xs text-muted-foreground">({reservationsData.pagination.total})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="px-4 py-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by reservation number..."
        />
      </div>

      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {reservations.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No reservations found"
              description={
                search || activeTab !== 'all'
                  ? 'No reservations match your search or filter'
                  : 'No material reservations have been created yet'
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {reservations.map((reservation: Reservation) => (
                <button
                  key={reservation.id}
                  onClick={() => router.push(`/warehouse/reservations/${reservation.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {reservation.reservation_number}
                      </p>
                      <StatusBadge status={reservation.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {reservation.requestedBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {reservation.requestedBy.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(reservation.requested_date)}
                      </span>
                    </div>
                    {reservation.work_order_number && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        WO: {reservation.work_order_number}
                      </p>
                    )}
                    {reservation.ppm_work_order_number && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        PPM: {reservation.ppm_work_order_number}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {reservation.items && (
                      <span className="text-xs text-muted-foreground">
                        {reservation.items.length} item{reservation.items.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
