'use client';

import { useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '@/lib/api/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { Store, Slot } from '@/types/warehouse';
import {
  Warehouse,
  Package,
  Hash,
  MapPin,
  Calendar,
  Edit,
  Info,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SlotDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const slotId = params.id as string;
  const storeIdParam = searchParams.get('store_id') || '';

  // If we have a store_id, fetch slot directly
  // Otherwise, try to look up via slot's store relationship
  const {
    data: slotData,
    isLoading: slotLoading,
    refetch: refetchSlot,
  } = useQuery({
    queryKey: ['warehouse-slot', slotId, storeIdParam],
    queryFn: async () => {
      if (storeIdParam) {
        return warehouseApi.slots.show(storeIdParam, slotId);
      }
      // Try to look up by QR code as fallback or iterate stores
      // For now, we attempt to find the slot via the QR code endpoint
      const qrResult = await warehouseApi.slots.findByQrCode(slotId);
      if (qrResult.success && qrResult.data) {
        return warehouseApi.slots.show(qrResult.data.store_id, qrResult.data.id);
      }
      throw new Error('Store ID is required to view slot details');
    },
  });

  const slot = slotData?.data;
  const storeId = storeIdParam || slot?.store_id || '';

  // Fetch store details for context
  const { data: storeData } = useQuery({
    queryKey: ['warehouse-store', storeId],
    queryFn: () => warehouseApi.stores.show(storeId),
    enabled: !!storeId,
  });

  const store = storeData?.data;

  const handleRefresh = useCallback(async () => {
    await refetchSlot();
  }, [refetchSlot]);

  if (slotLoading) {
    return <PageLoading />;
  }

  if (!slot) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Slot Details" showBack />
        <EmptyState
          icon={Info}
          title="Slot not found"
          description="The requested slot could not be found. A store_id query parameter may be required."
          action={
            <button
              onClick={() => router.push('/warehouse')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Back to Warehouse
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={slot.name}
        subtitle={`Slot ${slot.slot_number}`}
        showBack
        backHref={storeId ? `/warehouse?store=${storeId}` : '/warehouse'}
        actions={
          hasPermission('warehouse.slots.update') ? (
            <button
              onClick={() => router.push(`/warehouse/slots/${slotId}/edit?store_id=${storeId}`)}
              className="rounded-lg p-2 hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        {/* Slot Info Card */}
        <div className="space-y-4 p-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold">{slot.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Slot #{slot.slot_number}
                </p>
              </div>
            </div>

            {slot.description && (
              <p className="mt-3 text-sm text-muted-foreground">{slot.description}</p>
            )}

            <div className="mt-4 space-y-2">
              {/* Store Info */}
              {(store || slot.store) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Store:</span>
                  <span className="font-medium">
                    {store?.name || slot.store?.name}
                  </span>
                </div>
              )}

              {/* Store Number */}
              {(store || slot.store) && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Store #:</span>
                  <span className="font-medium">
                    {store?.store_number || slot.store?.store_number}
                  </span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(slot.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Slot Contents Section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Slot Contents
            </h3>
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <SlotContents storeId={storeId} slotId={slotId} />
            </div>
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

function SlotContents({ storeId, slotId }: { storeId: string; slotId: string }) {
  const router = useRouter();

  // Fetch items in this store and filter by slot
  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['warehouse-items-by-slot', storeId, slotId],
    queryFn: () => warehouseApi.items.list({ store_id: storeId, slot_id: slotId }),
    enabled: !!storeId,
  });

  const items = itemsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No items in this slot</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(`/warehouse/items/${item.id}`)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-4 w-4 text-emerald-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.item_number}</p>
          </div>
          {item.stores && item.stores.length > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold">
                {item.stores.find((s) => s.slot_id === slotId)?.quantity ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">in stock</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
