'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { assetsApi } from '@/lib/api/assets';
import { locationsApi } from '@/lib/api/locations';
import { LocationTree } from '@/types/location';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

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

function flattenTree(nodes: LocationTree[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'disposed', label: 'Disposed' },
];

export default function NewAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');

  const { data: locationsData } = useQuery({
    queryKey: ['locations-full-tree'],
    queryFn: () => locationsApi.getFullTree(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetFormData) => assetsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      router.push(`/assets/${response.data.id}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to create asset. Please try again.';
      setServerError(message);
    },
  });

  const onSubmit = (data: AssetFormData) => {
    setServerError('');
    createMutation.mutate(data);
  };

  const locationTree: LocationTree[] = locationsData?.data || [];
  const flatLocations = flattenTree(locationTree);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="New Asset" showBack />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Asset Name */}
          <div>
            <Label className="mb-1">
              Asset Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('asset_name')}
              type="text"
              placeholder="Enter asset name"
            />
            {errors.asset_name && (
              <p className="mt-1 text-xs text-destructive">{errors.asset_name.message}</p>
            )}
          </div>

          {/* Serial Number */}
          <div>
            <Label className="mb-1">Serial Number</Label>
            <Input
              {...register('serial_number')}
              type="text"
              placeholder="Enter serial number"
            />
          </div>

          {/* Barcode */}
          <div>
            <Label className="mb-1">Barcode</Label>
            <Input
              {...register('barcode')}
              type="text"
              placeholder="Enter barcode"
            />
          </div>

          {/* Status */}
          <div>
            <Label className="mb-1">
              Status <span className="text-destructive">*</span>
            </Label>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label className="mb-1">Location</Label>
            <select
              {...register('location_id')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a location</option>
              {flatLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {'—'.repeat(loc.depth)}{loc.depth > 0 ? ' ' : ''}{loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <Label className="mb-1">Manufacturer</Label>
            <Input
              {...register('manufacturer')}
              type="text"
              placeholder="Enter manufacturer"
            />
          </div>

          {/* Model */}
          <div>
            <Label className="mb-1">Model</Label>
            <Input
              {...register('model')}
              type="text"
              placeholder="Enter model"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1">Description</Label>
            <Textarea
              {...register('description')}
              rows={3}
              placeholder="Enter description"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3 safe-bottom">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 text-sm font-semibold"
            size="lg"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Asset'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
