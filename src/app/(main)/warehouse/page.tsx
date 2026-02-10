'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { warehouseApi } from '@/lib/api/warehouse';
import { reservationsApi } from '@/lib/api/reservations';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { Store, Item } from '@/types/warehouse';
import { Reservation } from '@/types/reservation';
import {
  Warehouse,
  Package,
  ClipboardList,
  Plus,
  MapPin,
  Hash,
  ChevronRight,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState('stores');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { hasPermission } = useAuth();

  // Stores query
  const {
    data: storesData,
    isLoading: storesLoading,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['warehouse-stores', search],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      return warehouseApi.stores.list(params);
    },
    enabled: activeTab === 'stores',
  });

  // Items query
  const {
    data: itemsData,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['warehouse-items', search],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      return warehouseApi.items.list(params);
    },
    enabled: activeTab === 'items',
  });

  // Reservations query
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    refetch: refetchReservations,
  } = useQuery({
    queryKey: ['warehouse-reservations', search],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      return reservationsApi.list(params);
    },
    enabled: activeTab === 'reservations',
  });

  const stores = storesData?.data || [];
  const items = itemsData?.data || [];
  const reservations = reservationsData?.data || [];

  const isLoading =
    (activeTab === 'stores' && storesLoading) ||
    (activeTab === 'items' && itemsLoading) ||
    (activeTab === 'reservations' && reservationsLoading);

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'stores') await refetchStores();
    if (activeTab === 'items') await refetchItems();
    if (activeTab === 'reservations') await refetchReservations();
  }, [activeTab, refetchStores, refetchItems, refetchReservations]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const searchPlaceholder = useMemo(() => {
    switch (activeTab) {
      case 'stores':
        return 'Search stores...';
      case 'items':
        return 'Search items...';
      case 'reservations':
        return 'Search reservations...';
      default:
        return 'Search...';
    }
  }, [activeTab]);

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'items' && hasPermission('warehouse.items.create') && (
        <Button
          onClick={() => router.push('/warehouse/items/new')}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Item
        </Button>
      )}
      {activeTab === 'reservations' && hasPermission('warehouse.reservations.create') && (
        <Button
          onClick={() => router.push('/warehouse/reservations/new')}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Reserve
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Warehouse" actions={headerActions} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="stores">
            Stores
            {storesData?.pagination?.total !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">({storesData.pagination.total})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="items">
            Items
            {itemsData?.pagination?.total !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">({itemsData.pagination.total})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reservations">
            Reservations
            {reservationsData?.pagination?.total !== undefined && (
              <span className="ml-1 text-xs text-muted-foreground">({reservationsData.pagination.total})</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="px-4 py-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder={searchPlaceholder}
        />
      </div>

      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {/* Stores Tab */}
          {activeTab === 'stores' && (
            <>
              {stores.length === 0 ? (
                <EmptyState
                  icon={Warehouse}
                  title="No stores found"
                  description="No warehouse stores match your search"
                />
              ) : (
                <div className="divide-y divide-border">
                  {stores.map((store: Store) => (
                    <button
                      key={store.id}
                      onClick={() => router.push(`/warehouse?store=${store.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Warehouse className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{store.name}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {store.store_number}
                          </span>
                          {store.location?.name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {store.location.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={store.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <>
              {items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No items found"
                  description="No warehouse items match your search"
                />
              ) : (
                <div className="divide-y divide-border">
                  {items.map((item: Item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/warehouse/items/${item.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.item_number}</span>
                          {item.category && (
                            <span className="rounded bg-muted px-1.5 py-0.5">
                              {item.category.label}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.unit_price !== undefined && item.unit_price !== null && (
                        <span className="text-sm font-medium text-muted-foreground">
                          ${item.unit_price.toFixed(2)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <>
              {reservations.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No reservations found"
                  description="No reservations match your search"
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
                        <p className="text-sm font-medium truncate">
                          {reservation.reservation_number}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {reservation.requestedBy && (
                            <span>{reservation.requestedBy.name}</span>
                          )}
                          <span>{formatDate(reservation.requested_date)}</span>
                        </div>
                      </div>
                      <StatusBadge status={reservation.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
