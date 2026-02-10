'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '@/lib/api/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { ImageUploader } from '@/components/camera/image-uploader';
import { ItemStore } from '@/types/warehouse';
import {
  Package,
  Edit,
  Barcode,
  Hash,
  Tag,
  DollarSign,
  Warehouse,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Camera,
  Info,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useState } from 'react';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const itemId = params.id as string;
  const [showImageUpload, setShowImageUpload] = useState(false);

  const {
    data: itemData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['warehouse-item', itemId],
    queryFn: () => warehouseApi.items.show(itemId),
  });

  const item = itemData?.data;

  const uploadImageMutation = useMutation({
    mutationFn: (formData: FormData) => warehouseApi.items.uploadImage(itemId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-item', itemId] });
      setShowImageUpload(false);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => warehouseApi.items.deleteImage(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-item', itemId] });
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleImageUpload = (images: { url: string; file?: File }[]) => {
    if (images.length > 0 && images[0].file) {
      const formData = new FormData();
      formData.append('image', images[0].file);
      uploadImageMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!item) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Item Details" showBack />
        <EmptyState
          icon={Info}
          title="Item not found"
          description="The requested item could not be found."
          action={
            <Button
              onClick={() => router.push('/warehouse/items')}
            >
              Back to Items
            </Button>
          }
        />
      </div>
    );
  }

  const totalStock = item.stores?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const totalAvailable = item.stores?.reduce((sum, s) => sum + s.available_quantity, 0) ?? 0;
  const totalReserved = item.stores?.reduce((sum, s) => sum + s.reserved_quantity, 0) ?? 0;
  const isLowStock = item.min_level !== undefined && totalAvailable <= item.min_level;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={item.name}
        subtitle={item.item_number}
        showBack
        backHref="/warehouse/items"
        actions={
          hasPermission('warehouse.items.update') ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/warehouse/items/${itemId}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : undefined
        }
      />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="space-y-4 p-4">
          {/* Item Image */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {item.image_url ? (
              <div className="relative">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-48 w-full object-cover"
                />
                {hasPermission('warehouse.items.update') && (
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium shadow backdrop-blur-sm"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => deleteImageMutation.mutate()}
                      disabled={deleteImageMutation.isPending}
                      className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow backdrop-blur-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mb-2" />
                <p className="text-sm">No image</p>
                {hasPermission('warehouse.items.update') && (
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="mt-2 flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    <Camera className="h-3 w-3" />
                    Add Photo
                  </button>
                )}
              </div>
            )}

            {showImageUpload && (
              <div className="border-t border-border p-4">
                <ImageUploader
                  images={[]}
                  onChange={handleImageUpload}
                  maxImages={1}
                />
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Low Stock Warning */}
          {isLowStock && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Low stock warning: Available quantity ({totalAvailable}) is at or below minimum level ({item.min_level})
              </span>
            </div>
          )}

          {/* Item Info Card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Item Number:</span>
                <span className="font-medium">{item.item_number}</span>
              </div>

              {item.barcode && (
                <div className="flex items-center gap-2 text-sm">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Barcode:</span>
                  <span className="font-medium">{item.barcode}</span>
                </div>
              )}

              {item.part_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Part Number:</span>
                  <span className="font-medium">{item.part_number}</span>
                </div>
              )}

              {item.category && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{item.category.label}</span>
                </div>
              )}

              {item.unit_price !== undefined && item.unit_price !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span className="font-medium">${item.unit_price.toFixed(2)}</span>
                </div>
              )}

              {item.defaultStore && (
                <div className="flex items-center gap-2 text-sm">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Default Store:</span>
                  <span className="font-medium">{item.defaultStore.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Summary Card */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Stock Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-lg font-bold text-blue-700">{totalStock}</p>
                <p className="text-xs text-blue-600">Total</p>
              </div>
              <div className={cn(
                'rounded-lg p-3 text-center',
                isLowStock ? 'bg-yellow-50' : 'bg-green-50'
              )}>
                <p className={cn(
                  'text-lg font-bold',
                  isLowStock ? 'text-yellow-700' : 'text-green-700'
                )}>
                  {totalAvailable}
                </p>
                <p className={cn(
                  'text-xs',
                  isLowStock ? 'text-yellow-600' : 'text-green-600'
                )}>
                  Available
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-lg font-bold text-orange-700">{totalReserved}</p>
                <p className="text-xs text-orange-600">Reserved</p>
              </div>
            </div>

            {item.min_level !== undefined && item.max_level !== undefined && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" />
                  Min: {item.min_level}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  Max: {item.max_level}
                </span>
              </div>
            )}
          </div>

          {/* Store Stock Levels */}
          {item.stores && item.stores.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Stock by Store
              </h3>
              <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
                {item.stores.map((storeItem: ItemStore) => (
                  <div key={storeItem.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {storeItem.store?.name || `Store ${storeItem.store_id}`}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{storeItem.quantity}</span>
                    </div>
                    {storeItem.slot && (
                      <p className="mt-0.5 ml-6 text-xs text-muted-foreground">
                        Slot: {storeItem.slot.name} ({storeItem.slot.slot_number})
                      </p>
                    )}
                    <div className="mt-1 ml-6 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-green-600">
                        Avail: {storeItem.available_quantity}
                      </span>
                      <span className="text-orange-600">
                        Reserved: {storeItem.reserved_quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="pb-4 text-center text-xs text-muted-foreground">
            Created {formatDate(item.created_at)} &middot; Updated {formatDate(item.updated_at)}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}
