'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { assetsApi } from '@/lib/api/assets';
import { locationsApi } from '@/lib/api/locations';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoading, LoadingSpinner } from '@/components/ui/loading-spinner';

const assetSchema = z.object({
  asset_name: z.string().min(1, 'Asset name is required'),
  serial_number: z.string().optional(),
  barcode: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  location_id: z.string().optional(),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'disposed', label: 'Disposed' },
];

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [serverError, setServerError] = useState('');

  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.show(id),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
  });

  // Populate form when asset data loads
  useEffect(() => {
    if (assetData?.data) {
      const asset = assetData.data;
      reset({
        asset_name: asset.asset_name,
        serial_number: asset.serial_number || '',
        barcode: asset.barcode || '',
        status: asset.status,
        location_id: asset.location_id || '',
        description: asset.description || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
      });
    }
  }, [assetData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: AssetFormData) => assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      router.push(`/assets/${id}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to update asset. Please try again.';
      setServerError(message);
    },
  });

  const onSubmit = (data: AssetFormData) => {
    setServerError('');
    updateMutation.mutate(data);
  };

  if (assetLoading) {
    return <PageLoading />;
  }

  const asset = assetData?.data;

  if (!asset) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Asset Not Found" showBack />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">This asset could not be found.</p>
        </div>
      </div>
    );
  }

  const locations = locationsData?.data || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Edit Asset"
        subtitle={asset.asset_number}
        showBack
        backHref={`/assets/${id}`}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4">
          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Asset Name */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('asset_name')}
              type="text"
              placeholder="Enter asset name"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.asset_name && (
              <p className="mt-1 text-xs text-red-500">{errors.asset_name.message}</p>
            )}
          </div>

          {/* Serial Number */}
          <div>
            <label className="mb-1 block text-sm font-medium">Serial Number</label>
            <input
              {...register('serial_number')}
              type="text"
              placeholder="Enter serial number"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="mb-1 block text-sm font-medium">Barcode</label>
            <input
              {...register('barcode')}
              type="text"
              placeholder="Enter barcode"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <select
              {...register('location_id')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="mb-1 block text-sm font-medium">Manufacturer</label>
            <input
              {...register('manufacturer')}
              type="text"
              placeholder="Enter manufacturer"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Model */}
          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            <input
              {...register('model')}
              type="text"
              placeholder="Enter model"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Enter description"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 border-t border-border bg-white px-4 py-3 safe-bottom">
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
