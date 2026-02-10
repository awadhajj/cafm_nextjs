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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
            <Label htmlFor="name" className="mb-1.5">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Main Building"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <Label htmlFor="code" className="mb-1.5">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="e.g. BLDG-001"
              className="font-mono"
              {...register('code')}
              aria-invalid={!!errors.code}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>

          {/* Location Type */}
          <div>
            <Label htmlFor="type" className="mb-1.5">
              Location Type <span className="text-destructive">*</span>
            </Label>
            <select
              id="type"
              {...register('type')}
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1',
                errors.type
                  ? 'border-destructive focus:border-destructive focus:ring-destructive'
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
              <p className="mt-1 text-xs text-destructive">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="mb-1.5">
              Status <span className="text-destructive">*</span>
            </Label>
            <select
              id="status"
              {...register('status')}
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1',
                errors.status
                  ? 'border-destructive focus:border-destructive focus:ring-destructive'
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
              <p className="mt-1 text-xs text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Parent Location */}
          <div>
            <Label htmlFor="parent_location_id" className="mb-1.5">
              Parent Location
            </Label>
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            <Label htmlFor="description" className="mb-1.5">
              Description
            </Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Optional description..."
              className="resize-none"
              {...register('description')}
            />
          </div>

          {/* Error Message */}
          {updateMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to update location. Please check your input and try again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3 safe-bottom">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="w-full py-3 h-auto"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
