'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { warehouseApi } from '@/lib/api/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoading } from '@/components/ui/loading-spinner';
import { useAuth } from '@/providers/auth-provider';
import { Store } from '@/types/warehouse';
import { Warehouse, ChevronDown } from 'lucide-react';

const createSlotSchema = z.object({
  slot_number: z.string().min(1, 'Slot number is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type CreateSlotForm = z.infer<typeof createSlotSchema>;

export default function CreateSlotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const storeIdParam = searchParams.get('store_id') || '';
  const [selectedStoreId, setSelectedStoreId] = useState(storeIdParam);
  const [submitError, setSubmitError] = useState('');

  // Fetch stores for selector if no store_id param
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['warehouse-stores'],
    queryFn: () => warehouseApi.stores.list(),
    enabled: !storeIdParam,
  });

  const stores = storesData?.data || [];

  // Auto-select first store if none provided
  useEffect(() => {
    if (!storeIdParam && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [storeIdParam, stores, selectedStoreId]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSlotForm>({
    resolver: zodResolver(createSlotSchema),
    defaultValues: {
      slot_number: '',
      name: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSlotForm) => {
      return warehouseApi.slots.create(selectedStoreId, {
        slot_number: data.slot_number,
        name: data.name,
        description: data.description || undefined,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-slots', selectedStoreId] });
      router.push(`/warehouse/slots/${result.data.id}?store_id=${selectedStoreId}`);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create slot. Please try again.';
      setSubmitError(message);
    },
  });

  const onSubmit = (data: CreateSlotForm) => {
    if (!selectedStoreId) {
      setSubmitError('Please select a store.');
      return;
    }
    setSubmitError('');
    createMutation.mutate(data);
  };

  if (!storeIdParam && storesLoading) {
    return <PageLoading />;
  }

  if (!hasPermission('warehouse.slots.create')) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Create Slot" showBack />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            You do not have permission to create slots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Create Slot" showBack />

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
          {submitError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Store Selector */}
          {!storeIdParam && (
            <div>
              <label htmlFor="store_id" className="mb-1 block text-sm font-medium">
                Store <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="store_id"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select a store...</option>
                  {stores.map((store: Store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.store_number})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}

          {storeIdParam && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5">
              <Warehouse className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Creating slot for store: {storeIdParam}
              </span>
            </div>
          )}

          {/* Slot Number */}
          <div>
            <label htmlFor="slot_number" className="mb-1 block text-sm font-medium">
              Slot Number <span className="text-red-500">*</span>
            </label>
            <input
              id="slot_number"
              type="text"
              {...register('slot_number')}
              placeholder="e.g., A-01"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.slot_number && (
              <p className="mt-1 text-xs text-red-500">{errors.slot_number.message}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g., Shelf A Row 1"
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
              placeholder="Optional description of this slot..."
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Slot'}
          </button>
        </form>
      </div>
    </div>
  );
}
