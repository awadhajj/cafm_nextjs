'use client';

import { useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2 } from 'lucide-react';
import { locationsApi } from '@/lib/api/locations';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoading } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  type: z.enum(['campus', 'building', 'floor', 'room'], {
    message: 'Location type is required',
  }),
  status: z.string().min(1, 'Status is required'),
  description: z.string().optional(),
  parent_location_id: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

const LOCATION_TYPES = [
  { value: 'campus', label: 'Campus' },
  { value: 'building', label: 'Building' },
  { value: 'floor', label: 'Floor' },
  { value: 'room', label: 'Room' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationsApi.show(id),
    enabled: !!id,
  });

  // Fetch parent locations for the dropdown (excluding current location)
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations-parent-options'],
    queryFn: () => locationsApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (data?.data) {
      const location = data.data;
      reset({
        name: location.name,
        code: location.code,
        type: location.type as LocationFormData['type'],
        status: location.status,
        description: location.description || '',
        parent_location_id: location.parent_location_id || '',
      });
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (formData: LocationFormData) => {
      const payload: Record<string, unknown> = { ...formData };
      // Remove empty optional fields
      if (!payload.description) delete payload.description;
      if (!payload.parent_location_id) delete payload.parent_location_id;
      return locationsApi.update(
        id,
        payload as Parameters<typeof locationsApi.update>[1]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      router.push(`/properties/${id}`);
    },
  });

  const onSubmit = useCallback(
    (formData: LocationFormData) => {
      updateMutation.mutate(formData);
    },
    [updateMutation]
  );

  if (isLoading) {
    return <PageLoading />;
  }

  const location = data?.data;
  if (!location) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Edit Location" showBack />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Location not found</p>
        </div>
      </div>
    );
  }

  const parentLocations = (locationsData?.data || []).filter(
    (loc) => loc.id !== id
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Edit Location"
        subtitle={location.name}
        showBack
        backHref={`/properties/${id}`}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto"
      >
        <div className="space-y-5 px-4 py-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Main Building"
              {...register('name')}
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-primary focus:ring-primary'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label
              htmlFor="code"
              className="mb-1.5 block text-sm font-medium"
            >
              Code <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              placeholder="e.g. BLDG-001"
              {...register('code')}
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-1',
                errors.code
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-primary focus:ring-primary'
              )}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>

          {/* Location Type */}
          <div>
            <label
              htmlFor="type"
              className="mb-1.5 block text-sm font-medium"
            >
              Location Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              {...register('type')}
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                errors.type
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-primary focus:ring-primary'
              )}
            >
              <option value="">Select type...</option>
              {LOCATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-xs text-red-500">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium"
            >
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              {...register('status')}
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                errors.status
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-border focus:border-primary focus:ring-primary'
              )}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-500">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Parent Location */}
          <div>
            <label
              htmlFor="parent_location_id"
              className="mb-1.5 block text-sm font-medium"
            >
              Parent Location
            </label>
            {isLoadingLocations ? (
              <div className="flex h-10 items-center rounded-lg border border-border px-3">
                <span className="text-sm text-muted-foreground">
                  Loading locations...
                </span>
              </div>
            ) : (
              <select
                id="parent_location_id"
                {...register('parent_location_id')}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">None (Top Level)</option>
                {parentLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Optional description..."
              {...register('description')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Error Message */}
          {updateMutation.isError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              Failed to update location. Please check your input and try again.
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 border-t border-border bg-white px-4 py-3 safe-bottom">
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
