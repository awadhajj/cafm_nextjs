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
import { useAuth } from '@/providers/auth-provider';
import { Store } from '@/types/warehouse';
import { ChevronDown } from 'lucide-react';

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  default_store_id: z.string().optional(),
  min_level: z.coerce.number().min(0, 'Must be 0 or greater').optional().or(z.literal('')),
  max_level: z.coerce.number().min(0, 'Must be 0 or greater').optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0, 'Must be 0 or greater').optional().or(z.literal('')),
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
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Item name"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Item description..."
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Barcode */}
          <div>
            <label htmlFor="barcode" className="mb-1 block text-sm font-medium">
              Barcode
            </label>
            <input
              id="barcode"
              type="text"
              {...register('barcode')}
              placeholder="e.g., 123456789"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Part Number */}
          <div>
            <label htmlFor="part_number" className="mb-1 block text-sm font-medium">
              Part Number
            </label>
            <input
              id="part_number"
              type="text"
              {...register('part_number')}
              placeholder="e.g., PN-12345"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category ID */}
          <div>
            <label htmlFor="category_id" className="mb-1 block text-sm font-medium">
              Category ID
            </label>
            <input
              id="category_id"
              type="text"
              {...register('category_id')}
              placeholder="Category identifier"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Default Store */}
          <div>
            <label htmlFor="default_store_id" className="mb-1 block text-sm font-medium">
              Default Store
            </label>
            <div className="relative">
              <select
                id="default_store_id"
                {...register('default_store_id')}
                className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              <label htmlFor="min_level" className="mb-1 block text-sm font-medium">
                Min Level
              </label>
              <input
                id="min_level"
                type="number"
                min="0"
                step="1"
                {...register('min_level')}
                placeholder="0"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.min_level && (
                <p className="mt-1 text-xs text-red-500">{errors.min_level.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="max_level" className="mb-1 block text-sm font-medium">
                Max Level
              </label>
              <input
                id="max_level"
                type="number"
                min="0"
                step="1"
                {...register('max_level')}
                placeholder="0"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.max_level && (
                <p className="mt-1 text-xs text-red-500">{errors.max_level.message}</p>
              )}
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label htmlFor="unit_price" className="mb-1 block text-sm font-medium">
              Unit Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                id="unit_price"
                type="number"
                min="0"
                step="0.01"
                {...register('unit_price')}
                placeholder="0.00"
                className="w-full rounded-lg border border-border py-2.5 pl-7 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {errors.unit_price && (
              <p className="mt-1 text-xs text-red-500">{errors.unit_price.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pb-4">
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
