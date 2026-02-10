'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { warehouseApi } from '@/lib/api/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/auth-provider';
import { Store } from '@/types/warehouse';
import { ChevronDown, AlertCircle } from 'lucide-react';

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  default_store_id: z.string().optional(),
  min_level: z.string().optional(),
  max_level: z.string().optional(),
  unit_price: z.string().optional(),
  part_number: z.string().optional(),
});

type CreateItemForm = z.infer<typeof createItemSchema>;

export default function CreateItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [submitError, setSubmitError] = useState('');

  // Fetch stores for the default store selector
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['warehouse-stores'],
    queryFn: () => warehouseApi.stores.list(),
  });

  const stores = storesData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateItemForm>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      description: '',
      barcode: '',
      category_id: '',
      default_store_id: '',
      min_level: '',
      max_level: '',
      unit_price: '',
      part_number: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData: CreateItemForm) => {
      const payload: Record<string, unknown> = {
        name: formData.name,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.barcode) payload.barcode = formData.barcode;
      if (formData.category_id) payload.category_id = formData.category_id;
      if (formData.default_store_id) payload.default_store_id = formData.default_store_id;
      if (formData.min_level !== '' && formData.min_level !== undefined) payload.min_level = Number(formData.min_level);
      if (formData.max_level !== '' && formData.max_level !== undefined) payload.max_level = Number(formData.max_level);
      if (formData.unit_price !== '' && formData.unit_price !== undefined) payload.unit_price = Number(formData.unit_price);
      if (formData.part_number) payload.part_number = formData.part_number;

      return warehouseApi.items.create(payload as Partial<import('@/types/warehouse').Item>);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
      router.push(`/warehouse/items/${result.data.id}`);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create item. Please try again.';
      setSubmitError(message);
    },
  });

  const onSubmit = (data: CreateItemForm) => {
    setSubmitError('');
    createMutation.mutate(data);
  };

  if (!hasPermission('warehouse.items.create')) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="New Item" showBack />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            You do not have permission to create items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="New Item" showBack backHref="/warehouse/items" />

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="name" className="mb-1">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Item name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="mb-1">
              Description
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Item description..."
              className="resize-none"
            />
          </div>

          {/* Barcode */}
          <div>
            <Label htmlFor="barcode" className="mb-1">
              Barcode
            </Label>
            <Input
              id="barcode"
              type="text"
              {...register('barcode')}
              placeholder="e.g., 123456789"
            />
          </div>

          {/* Part Number */}
          <div>
            <Label htmlFor="part_number" className="mb-1">
              Part Number
            </Label>
            <Input
              id="part_number"
              type="text"
              {...register('part_number')}
              placeholder="e.g., PN-12345"
            />
          </div>

          {/* Category ID */}
          <div>
            <Label htmlFor="category_id" className="mb-1">
              Category ID
            </Label>
            <Input
              id="category_id"
              type="text"
              {...register('category_id')}
              placeholder="Category identifier"
            />
          </div>

          {/* Default Store */}
          <div>
            <Label htmlFor="default_store_id" className="mb-1">
              Default Store
            </Label>
            <div className="relative">
              <select
                id="default_store_id"
                {...register('default_store_id')}
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a store (optional)</option>
                {stores.map((store: Store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.store_number})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Min / Max Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min_level" className="mb-1">
                Min Level
              </Label>
              <Input
                id="min_level"
                type="number"
                min="0"
                step="1"
                {...register('min_level')}
                placeholder="0"
              />
              {errors.min_level && (
                <p className="mt-1 text-xs text-destructive">{errors.min_level.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="max_level" className="mb-1">
                Max Level
              </Label>
              <Input
                id="max_level"
                type="number"
                min="0"
                step="1"
                {...register('max_level')}
                placeholder="0"
              />
              {errors.max_level && (
                <p className="mt-1 text-xs text-destructive">{errors.max_level.message}</p>
              )}
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <Label htmlFor="unit_price" className="mb-1">
              Unit Price
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                {...register('unit_price')}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            {errors.unit_price && (
              <p className="mt-1 text-xs text-destructive">{errors.unit_price.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pb-4">
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
